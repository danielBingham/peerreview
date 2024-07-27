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
import express, { RequestHandler } from 'express'
import multer from 'multer'
import { Core } from '@danielbingham/peerreview-core' 
import { File } from '@danielbingham/peerreview-model'
import { FileController } from '../../controllers/foundation/FileController'

// RequestHandler<Request Params, Response Body, Request Body, Request Query>
export function initializeFileRoutes(core: Core, router: express.Router) {
    const fileController = new FileController(core)
    const upload = multer({ dest: 'public/uploads/tmp' })

    // Upload a version of the paper.
    const postFile: RequestHandler<{}, File, {}, {}> = function(
        req, res, next
    ){
        fileController.upload(req.session.user, req.file)
        .then(function(results) {
            res.status(200).json(results)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.post('/upload', upload.single('file'), postFile)

    const deleteFile: RequestHandler<{ id: string}, { fileId: string }, {}, {}> = function(
        req, res, next
    ) {
        fileController.deleteFile(req.session.user, req.params.id)
        .then(function(results) {
            res.status(200).json(results)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.delete('/file/:id', deleteFile)
}
