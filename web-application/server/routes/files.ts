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
import express from 'express'
import multer from 'multer'

import { Core } from '@danielbingham/peerreview-core' 
import { FileController } from './controllers/FileController'

export function initializeFileRoutes(core: Core, router: express.Router) {
    const fileController = new FileController(core)
    const upload = multer({ dest: 'public/uploads/tmp' })

    // Upload a version of the paper.
    router.post('/upload', upload.single('file'), function(request, response, next) {
        fileController.upload(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/file/:id', function(request, response, next) {
        fileController.deleteFile(request, response).catch(function(error) {
            next(error)
        })
    })
}
