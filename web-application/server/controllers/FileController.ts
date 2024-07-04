/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { Request, Response } from 'express'
import mime from 'mime'
import { v4 as uuidv4 } from 'uuid'

import { Core } from '@danielbingham/peerreview-core' 
import { S3FileService, FileDAO } from '@danielbingham/peerreview-backend'

import { ControllerError } from '../errors/ControllerError'

/** 
 * @todo TECHDEBT File uses a UUID as the primary key.  UUIDs are string.  Model
* assumes id is a number.  Typescript doesn't notice, because File which
* extends Model is only ever set from the database, and javascript doesn't
* actually care whether id is a string or number.  PartialFile has id as a
* string and that's the only one typescript can actually enforce a type on,
* because that's what gets passed in. But this is significant tech debt that we
* should resolve. 
* **/
export class FileController {
    core: Core

    fileService: S3FileService
    fileDAO: FileDAO

    constructor(core: Core) {
        this.core = core

        this.fileService = new S3FileService(core)
        this.fileDAO = new FileDAO(core)
    }

    /**
     * POST /upload
     *
     * Allows the user to upload a file, which can then be used by other
     * entities.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.file The file information, defined by multer.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async upload(request: Request, response: Response): Promise<void> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         *
         * Validation:
         *
         * 1. File must be PDF, JPEG, or PNG.
         * 
         * ********************************************************************/

        // 1. User must be logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Must have a logged in user to upload a file.`)
        }

        /**********************************************************************
         * Validation
         **********************************************************************/

        const type = request.file.mimetype 
        // Define which file types are valid.
        const validTypes = [
            // For papers.
            'application/pdf',

            // For Profile images.
            'image/jpeg',
            'image/png'
        ]

        // 1. File must be PDF, JPEG, or PNG.
        if ( ! validTypes.includes(type) ) {
            throw new ControllerError(400, 'invalid-type',
                `User(${request.session.user.id}) attempted to upload an invalid file of type ${type}.`)
        }

        /**********************************************************************
         * Permissions and Validation checks complete.
         *      Upload the file.
         **********************************************************************/

        const currentPath = request.file.path

        const id = uuidv4()
        const filepath = `files/${id}.${mime.getExtension(type)}`

        await this.fileService.uploadFile(currentPath, filepath)

        const file = {
            id: id,
            userId: request.session.user.id,
            type: type,
            location: this.core.config.s3.bucket_url,
            filepath: filepath
        }

        await this.fileDAO.insertFile(file)

        const files = await this.fileDAO.selectFiles({ 
            where: 'files.id = $1', 
            params: [ id ]
        })
        if ( ! ( id in files.dictionary)) {
            // If we don't clean this up, we could wind up with a memory leak.
            this.fileService.removeLocalFile(currentPath)
            throw new ControllerError(500, 'insertion-failure', `Failed to select newly inserted file ${id}.`)
        }

        this.fileService.removeLocalFile(currentPath)
        response.status(200).json(files[0])
        return
    }

    /**
     * DELETE /file/:id
     *
     * Delete a file, remove it from the database and from file storage.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The database id of the file we wish to delete.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteFile(request: Request, response: Response): Promise<void> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User must be owner of File(:id)
         * 3. File must not be in use by a published paper.
         *
         * Validation:
         *
         * 1. File(:id) must exist.
         * 
         * ********************************************************************/

        // Permissions: 1. User must be logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Must have a logged in user to delete a file.`)
        }

        const files = await this.fileDAO.selectFiles({ 
            where: 'files.id = $1', 
            params: [ request.params.id ]
        })

        // Validation: 1. File(:id) must exist.
        if ( ! (request.params.id in files.dictionary)) {
            throw new ControllerError(404, 'not-found', `File ${request.params.id} not found!`)
        } 

        // Permissions: 2. User must be owner of File(:id)
        if ( files[request.params.id].userId !== request.session.user.id ) {
            // TODO Admin and moderator permissions.
            throw new ControllerError(403, 'not-authorized', `User(${request.session.user.id}) attempting to delete file(${files[0].id}, which they don't own.`)
        }

        const results = await this.core.database.query(`
            SELECT
                papers.id, papers.is_draft
            FROM papers
                LEFT OUTER JOIN paper_versions ON papers.id = paper_versions.paper_id
            WHERE paper_versions.file_id = $1 AND papers.is_draft = false
        `, [ request.params.id ])

        // 3. File must not be in use by a published paper.
        if ( results.rows.length > 0 ) {
            throw new ControllerError(403, 'not-authorized:published',
                `User(${request.session.user.id}) attempting to delete File(${request.params.id}) that is attached to a published paper.`)
        }

        // NOTE: We don't need to worry about files in use as profile images,
        // because the database constraint will simply set the users.file_id
        // field to null when the file is deleted.

        /**********************************************************************
         * Permissions and Validation checks complete.
         *      Delete the file.
         **********************************************************************/

        await this.fileService.removeFile(files[0].filepath)

        // Database constraints should handle any cascading here.
        const fileId = request.params.id
        await this.fileDAO.deleteFile(fileId)
        response.status(200).json({ fileId: fileId })
    }
}
