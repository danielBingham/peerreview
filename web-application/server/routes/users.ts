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
import express, { RequestHandler, Request, Response, NextFunction } from 'express'
import { Core } from '@danielbingham/peerreview-core' 
import { User, PartialUser, UserQuery, UserAuthorization, QueryResult, EntityResult } from '@danielbingham/peerreview-model'
    
import { UserController } from '../controllers/UserController'

interface UserParams { id: number }

// RequestHandler<Request Params, Response Body, Request Body, Request Query>
export function initializeUserRoutes(core: Core, router: express.Router) {

    const userController = new UserController(core)

    /**************************************************************************
     * GET /users
     *
     * Query for User models.
     *
     * ************************************************************************/
    const getUsers: RequestHandler<unknown, QueryResult<User>, unknown, UserQuery> = function(req, res, next) {
        userController.getUsers(req.query)
            .then(function(result: QueryResult<User>) {
                res.status(200).json(result)
            }).catch(function(error: any) {
                next(error)
            })
    }
    router.get('/users', getUsers)

    /**************************************************************************
     * POST /users
     *
     * Create a new user.
     *
     * ************************************************************************/
    const postUsers: RequestHandler<unknown, EntityResult<User>, PartialUser, unknown> = function(req, res, next) {
        userController.postUsers(req.session?.user, req.body)
            .then(function(result: EntityResult<User>) {
                res.status(201).json(result)
            })
            .catch(function(error: any) {
                next(error)
            })

    }
    router.post('/users', postUsers)

    /**************************************************************************
     * GET /user/:id
     *
     * Get the User model identified by `:id`.
     *
     * ************************************************************************/
    const getUser: RequestHandler<UserParams, EntityResult<User>, unknown, unknown> = function(req, res, next) {
        userController.getUser(req.params.id)
            .then(function(result: EntityResult<User>) {
                res.status(200).json(result)
            })
            .catch(function(error: any) {
                next(error)
            })

    }
    router.get('/user/:id', getUser)

    /**************************************************************************
     * PATCH /user/:id
     *
     * Edit the existing User model identified by `:id`.
     *
     * ************************************************************************/
    interface PatchUserBody {
        user: PartialUser
        authorization: UserAuthorization
    }

    const patchUser: RequestHandler< UserParams, EntityResult<User>, PatchUserBody, unknown> = function(req, res, next) {

        userController.patchUser(
            req.session.user, 
            req.params.id, 
            req.body.user, 
            req.body.authorization,
            function(user: User) {
                req.session.user = user
            }
        ).then(function(results: EntityResult<User>) {
            res.status(200).json(results)
        })
        .catch(function(error: any) {
            next(error)
        })

    }
    router.patch('/user/:id', patchUser)

    /**************************************************************************
     * DELETE /user/:id
     *
     * Delete an existing user.
     *
     * ************************************************************************/
    const userDelete: RequestHandler<UserParams, unknown, unknown, unknown> = function(req, res, next) {
        userController.deleteUser(req.params.id)
        .then(function(result) {
            res.send(200).json(result)
        })
        .catch(function(error: any) {
            next(error)
        })
    }
    router.delete('/user/:id', userDelete)

}
