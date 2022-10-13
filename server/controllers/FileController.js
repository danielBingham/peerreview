const mime = require('mime')
const { v4: uuidv4 } = require('uuid')

const S3FileService = require('../services/S3FileService')
const FileDAO = require('../daos/files')
const ControllerError = require('../errors/ControllerError')
const DAOError = require('../errors/DAOError')

module.exports = class FileController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.fileService = new S3FileService(config)
        this.fileDAO = new FileDAO(this.database, this.logger)
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
    async upload(request, response) {
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
            location: this.config.spaces.bucket_url,
            filepath: filepath
        }

        await this.fileDAO.insertFile(file)

        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ id ])
        if ( files.length <= 0) {
            throw new ControllerError(500, 'insertion-failure', `Failed to select newly inserted file ${id}.`)
        }

        this.fileService.removeLocalFile(currentPath)
        return response.status(200).json(files[0])
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
    async deleteFile(request, response) {
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

        const files = await this.fileDAO.selectFiles('WHERE files.id = $1', [ request.params.id ])

        // Validation: 1. File(:id) must exist.
        if ( files.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `File ${request.params.id} not found!`)
        } 

        // Permissions: 2. User must be owner of File(:id)
        if ( files[0].userId !== request.session.user.id ) {
            // TODO Admin and moderator permissions.
            throw new ControllerError(403, 'not-authorized', `User(${request.session.user.id}) attempting to delete file(${files[0].id}, which they don't own.`)
        }

        const results = await this.database.query(`
            SELECT
                papers.id, papers.is_draft
            FROM papers
                LEFT OUTER JOIN paper_versions ON papers.id = paper_versions.paper_id
            WHERE paper_versions.file_id = $1 AND papers.id_draft = false
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
        return response.status(200).json({ fileId: fileId })
    }
}
