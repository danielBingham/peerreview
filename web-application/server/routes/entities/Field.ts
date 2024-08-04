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
import express, { RouteHandler } from 'express'
import { Core } from '@danielbingham/peerreview-core' 

export function initializeFieldRoutes(core: Core, router: express.Router) {
    const FieldController = require('./controllers/FieldController')
    const fieldController = new FieldController(core)

    // Get a list of all fields.
    router.get('/fields', function(request, response, next) {
        fieldController.getFields(request, response).catch(function(error) {
            next(error)
        })
    })

    // Create a new field 
    router.post('/fields', function(request, response, next) {
        fieldController.postFields(request, response).catch(function(error) {
            next(error)
        })
    })

    // Get the details of a single field 
    router.get('/field/:id', function(request, response, next) {
        fieldController.getField(request, response).catch(function(error) {
            next(error)
        })
    })

    // Replace a field wholesale.
    router.put('/field/:id', function(request, response, next) {
        fieldController.putField(request, response).catch(function(error) {
            next(error)
        })
    })

    // Edit an existing field with partial data.
    router.patch('/field/:id', function(request, response, next) {
        fieldController.patchField(request, response).catch(function(error) {
            next(error)
        })
    })

    // Delete an existing field.
    router.delete('/field/:id', function(request, response, next) {
        fieldController.deleteField(request, response).catch(function(error) {
            next(error)
        })
    })
}
