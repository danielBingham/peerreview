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

import { Core } from '@danielbingham/peerreview-core'
import { User, TokenType } from '@danielbingham/peerreview-model'

import { TokenController } from '../../controllers/foundation/TokenController'

// RequestHandler<Request Params, Response Body, Request Body, Request Query>
export function initializeTokenRoutes(core: Core, router: express.Router) {
    const tokenController = new TokenController(core)

    const getToken: RequestHandler<
        { token: string }, 
        User, 
        {}, 
        { type: TokenType}
    > = function(
        req, res, next
    ) {
        tokenController.getToken(req.params.token, req.query.type)
        .then(function(result) {
            res.status(200).json(result)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.get('/token/:token', getToken)

    const postToken: RequestHandler<{}, {}, { type: TokenType, email: string }, {}> = function(
        req, res, next
    ) {
        tokenController.postToken(req.body)
        .then(function() {
            res.status(200).send()
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.post('/tokens', postToken)

}
