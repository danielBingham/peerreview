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
import express, { RequestHandler, Request, Response } from 'express'
import { Core } from '@danielbingham/peerreview-core' 
import { User } from '@danielbingham/peerreview-model'
import { Credentials } from '@danielbingham/peerreview-backend'
import { AuthenticationController } from '../../controllers/foundation/AuthenticationController'


// RequestHandler<Request Params, Response Body, Request Body, Request Query>
export function initializeAuthenticationRoutes(core: Core, router: express.Router) {
    const authenticationController = new AuthenticationController(core)

    const getAuthentication: RequestHandler<{},User,{},{}> = function(
        req, res, next
    ) {
        authenticationController.getAuthentication(req.session.user)
        .then(function(result) {
            res.status(200).json(result)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.get('/authentication', getAuthentication)

    const postAuthentication: RequestHandler<{}, User, Credentials, {}> = function(
        req, res, next
    ) {
        authenticationController.postAuthentication(req.body, function(user: User) {
            req.session.user = user
        })
        .then(function(result) {
            res.status(200).json(result)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.post('/authentication', postAuthentication)

    const patchAuthentication: RequestHandler<{}, User, Credentials, {}> = function(
        req, res, next
    ) {
        authenticationController.patchAuthentication(req.body)
        .then(function(result) {
            res.status(200).json(result)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.patch('/authentication', patchAuthentication)


    router.delete('/authentication', function(request: Request, response: Response) {
        request.session.destroy(function(error) {
            if (error) {
                console.error(error)
                response.status(500).json({error: 'server-error'})
            } else {
                response.status(200).json(null)
            }
        })

    })
    
    router.post('/orcid/authentication', function(request, response, next) {
        authenticationController.postOrcidAuthentication(request, response).catch(function(error) {
            next(error)
        })
    })



}
