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

import { Core } from '@journalhub/core' 
import { Field, FieldQuery, QueryResult, EntityResult } from '@journalhub/model'
import { DataAccess } from '@journalhub/data-access'
import { FieldController } from '@journalhub/api'

// RequestHandler<Request Params, Response Body, Request Body, Request Query>
export function initializeFieldRoutes(core: Core, dao: DataAccess, router: express.Router) {
    const fieldController = new FieldController(core, dao)

    // Get a list of all fields.
    const getFields: RequestHandler<{}, QueryResult<Field>, {}, FieldQuery> = function(
        req, res, next
    ) {
        fieldController.getFields(req.query)
        .then(function(results) {
            res.status(200).json(results)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.get('/fields', getFields)

    // Get the details of a single field 
    const getField: RequestHandler<{id: number}, EntityResult<Field>, {}, {}> = function(
        req, res, next
    ) {
        fieldController.getField(req.params.id)
        .then(function(results) {
            res.status(200).json(results)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.get('/field/:id', getField)
}
