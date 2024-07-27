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
/******************************************************************************
 *      UserController
 *
 * Restful routes for manipulating users.
 *
 ******************************************************************************/
import { Pool, Client } from 'pg'
import { Core, ServiceError, DAOError } from '@danielbingham/peerreview-core' 
import { 
    User, 
    PartialUser,
    UserAuthorization,
    UserStatus,
    UserQuery, 
    TokenType,
    QueryResult,
    QueryRelations,
    EntityResult
} from '@danielbingham/peerreview-model'
import { 
    DAOQueryOrder, 
    DAOResult, 

    UserDAO, 
    TokenDAO,

    AuthenticationService, 
    EmailService,
    TokenService
} from '@danielbingham/peerreview-backend'

import { ControllerQueryOptions, ControllerQuery } from '../../types/ControllerQuery'
import { ControllerError } from '../../errors/ControllerError'

export class UserController {
    core: Core
    database: Pool | Client

    auth: AuthenticationService
    emailService: EmailService
    tokenService: TokenService

    userDAO: UserDAO
    tokenDAO: TokenDAO

    constructor(core: Core, database?: Pool | Client) {
        this.core = core

        this.database = core.database
        if ( database ) {
            this.database = database
        }

        this.auth = new AuthenticationService(core)
        this.emailService = new EmailService(core)
        this.tokenService = new TokenService(core)

        this.userDAO = new UserDAO(core)
        this.tokenDAO = new TokenDAO(core)
    }

    async getRelations(results: DAOResult<User>, requestedRelations?: string[]): Promise<QueryRelations> {
        return {}
    }

    /**
     * Parse a query string from the `GET /users` endpoint for use with both
     * `UsersDAO::selectUsers()` and `UsersDAO::countUsers()`.
     *
     * @param {Object} query    The query string (from `request.query`) that we
     * wish to parse.
     * @param {string} query.name   (Optional) A string to compare to user's names for
     * matches.  Compared using trigram matching.
     * @param {int} quer.page    (Optional) A page number indicating which page of
     * results we want.  
     * @param {string} query.sort (Optional) A sort parameter describing how we want
     * to sort users.
     * @param {Object} options  A dictionary of options that adjust how we
     * parse it.
     * @param {boolean} options.ignorePage  Skip the page parameter.  It will
     * still be in the result object and will default to `1`.
     *
     * @return {Object} A result object with the results in a form
     * understandable to `selectUsers()` and `countUsers()`.  Of the following
     * format:
     * ```
     * { 
     *  where: 'WHERE ...', // An SQL where statement.
     *  params: [], // An array of paramters matching the $1,$2, parameterization of `where`
     *  page: 1, // A page parameter, to select which page of results we want.
     *  order: '', // An SQL order statement.
     *  emptyResult: false // When `true` we can skip the selectUsers() call,
     *  // because we know we have no results to return.
     * }
     * ```
     */
    async parseQuery(query: UserQuery, options?: ControllerQueryOptions): Promise<ControllerQuery> {
        options = options || {
            ignorePage: false
        }

        const result: ControllerQuery = {
            daoQuery: {
                where: '',
                params: [],
                page: 1
            },
            emptyResult: false,
            requestedRelations: query.relations ? query.relations : []
        }

        if ( ! query) {
            return result
        }

        let count = 0


        if ( query.name && query.name.length > 0) {
            count += 1
            const and = count > 1 ? ' AND ' : ''
            result.daoQuery.where += `${and} SIMILARITY(users.name, $${count}) > 0`
            result.daoQuery.params.push(query.name)

            result.daoQuery.order = DAOQueryOrder.Override
            result.daoQuery.orderOverride = `SIMILARITY(users.name, $${count}) desc`
            // TODO We have access to the name here, but if we're paging with DISTINCT we don't want to allow
            // arbitrary orders.  This is a problem.
        }

        if ( query.ids && query.ids.length > 0 ) {
            count += 1
            const and = count > 1 ? ' AND ' : ''

            result.daoQuery.where += `${and} users.id = ANY($${count}::bigint[])`
            result.daoQuery.params.push(query.ids)
        }

        if ( query.page && ! options.ignorePage ) {
            result.daoQuery.page = query.page
        } else if ( ! options.ignorePage ) {
            result.daoQuery.page = 1
        }

        return result
    }

    /**
     * GET /users
     *
     * Respond with a list of `users` matching the query in the meta/result
     * format.
     */
    async getUsers(query: UserQuery): Promise<QueryResult<User>> {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Anyone may call this endpoint.
         * 
         * **********************************************************/

        const { daoQuery, emptyResult, requestedRelations } = await this.parseQuery(query)

        if ( emptyResult ) {
            return {
                dictionary: {},
                list: [],
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: 1,
                    numberOfPages: 1
                }, 
                relations: {} 
            }
        }
        const meta = await this.userDAO.countUsers(daoQuery)
        const daoResult = await this.userDAO.selectCleanUsers(daoQuery)
        const relations = await this.getRelations(daoResult, requestedRelations) 

        const result: QueryResult<User> = {
            dictionary: daoResult.dictionary,
            list: daoResult.list,
            meta: meta,
            relations: relations
        }

        return result
    }

    /**
     * POST /users
     *
     * Create a new `user`.
     */
    async postUsers(loggedInUser: User, user: PartialUser): Promise<EntityResult<User>> {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * There are two possible flows this endpoint can take, depending on
         * whether or not we have a logged in user already:
         *
         * 1. If no user is logged in, then we assume they are creating their
         * own user.  We'll send an email confirmation.
         * 2. If a user is logged in, then we assume they are inviting the user
         * they are creating.  We send an invitation email.
         *
         * Permissions: 
         * Anyone can call this endpoint.
         *
         * Validation:
         * 1. request.body.email must not already be attached to a user in the
         * database.
         * 2. Invitation => no password needed
         * 3. Registration => must include password
         * 4. request.body.name is required.
         * 5. request.body.email is required. 
         *
         * **********************************************************/
        user.email = user.email.toLowerCase()

        // If a user already exists with that email, send a 409 Conflict
        // response.
        //
        const userExistsResults = await this.database.query(
            'SELECT id, email FROM users WHERE email=$1',
            [ user.email ]
        )

        // 1. request.body.email must not already be attached to a user in the
        // database.
        if (userExistsResults.rowCount > 0) {
            throw new ControllerError(409, 'user-exists', `Attempting to create a user(${userExistsResults.rows[0].id}) that already exists!`)
        }

        // If we're creating a user with a password, then this is just a normal
        // unconfirmed user creation.  However, if we're creating a user
        // without a password, then this is a user who is being invited.
        //
        // Corresponds to:
        // Validation: 2. Invitation => no password needed
        // Validation: 3. Registration => must include password
        if ( user.password && ! loggedInUser ) {
            user.password = this.auth.hashPassword(user.password)
            user.status = UserStatus.Unconfirmed 
        } else if ( loggedInUser ) {
            user.status = UserStatus.Invited
        } else {
            throw new ControllerError(400, 'bad-data:no-password',
                `Users creating accounts must include a password!`)
        }

        try {
            user.id = await this.userDAO.insertUser(user)
        } catch ( error ) {
            if ( error instanceof DAOError ) {
                // `insertUser()` check both of the following:
                // 4. request.body.name is required.
                // 5. request.body.email is required. 
                if ( error.type == 'name-missing' ) {
                    throw new ControllerError(400, 'bad-data:no-name', error.message)
                } else if ( error.type == 'email-missing' ) {
                    throw new ControllerError(400, 'bad-data:no-email', error.message)
                } else {
                    throw error
                }
            } else {
                throw error
            }
        }

        const createdUserResults = await this.userDAO.selectUsers({ where: 'users.id=$1', params: [user.id]})

        if ( ! createdUserResults.dictionary[user.id] ) {
            throw new ControllerError(500, 'server-error', `No user found after insertion. Looking for id ${user.id}.`)
        }

        const createdUser = createdUserResults.dictionary[user.id]

        if ( loggedInUser ) {
            const partialToken = this.tokenService.createToken(createdUser.id, TokenType.Invitation)
            const id = await this.tokenDAO.insertToken(partialToken)

            const results = await this.tokenDAO.selectTokens({ where: 'tokens.id = $1', params: [ id ] })

            await this.emailService.sendInvitation(loggedInUser, createdUser, results.dictionary[id])
        } else {
            const partialToken = this.tokenService.createToken(createdUser.id, TokenType.EmailConfirmation)
            const id = await this.tokenDAO.insertToken(partialToken)

            const results = await this.tokenDAO.selectTokens({ where: 'tokens.id = $1', params: [ id ]})

            await this.emailService.sendEmailConfirmation(createdUser, results.dictionary[id])
        }

        const results = await this.userDAO.selectCleanUsers({ where: 'users.id=$1', params: [ user.id ] })

        if (! results.dictionary[user.id] ) {
            throw new ControllerError(500, 'server-error', `No user found after insertion. Looking for id ${user.id}.`)
        }

        const relations = await this.getRelations(results)

        return { 
            entity: results.dictionary[user.id],
            relations: relations
        }
    }

    /**
     * GET /user/:id
     *
     * Get details for a single user in thethis.database.
     */
    async getUser(id: number): Promise<EntityResult<User>> {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Anyone may call this endpoint.
         * 
         * **********************************************************/
        const results = await this.userDAO.selectCleanUsers({ where: 'users.id = $1', params: [id] })

        if ( ! results.dictionary[id] ) {
            throw new ControllerError(404, 'not-found', `User(${id}) not found.`)
        }

        const relations = await this.getRelations(results)

        return { 
            entity: results.dictionary[id],
            relations: relations
        }
    }

    /**
     * PATCH /user/:id
     *
     * Update an existing user from a patch.
     *
     */
    async patchUser(
        currentUser: User, 
        id: number, 
        user: PartialUser, 
        authorization: UserAuthorization,
        updateSessionUser: (user: User) => void
    ): Promise<EntityResult<User>> {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         * 1. User must be logged in.
         * 2. User being patched must be the same as the logged in user.
         * 2a. :id must equal request.session.user.id
         * 2b. :id must equal request.body.id
         * 3. User(:id) must exist.
         * 4. If a password is included, then oldPassword or a valid token are
         * required.
         * 5. If an email is included, then oldPassword is required.
         * 
         * **********************************************************/

        // 1. User must be logged in.
        if ( ! currentUser ) {
            throw new ControllerError(403, 'not-authorized', 
                `Unauthenticated user attempting to update User(${user.id}).`)
        } 

        // 2. User being patched must be the same as the logged in user.
        // 2a. :id must equal request.session.user.id
        //
        // NOTE: If this requirement changes (to allow admins to patch users,
        // for instance), then make sure to strip the email out of the returned
        // user at the botton of this function.  Or at least, spend some time
        // considering whether you need to.
        if ( currentUser.id != id) {
            throw new ControllerError(403, 'not-authorized', 
                `User(${currentUser.id}) attempted to update another User(${id}).`)
        }

        // 2. User being patched must be the same as the logged in user.
        // 2b. :id must equal request.body.id
        if ( id != user.id ) {
            throw new ControllerError(403, 'not-authorized:id-mismatch',
                `User(${id}) attempted to update another User(${user.id}).`)
        }
        const existingUsers = await this.userDAO.selectUsers({ where: `users.id = $1`, params: [ id ] })

        // 3. User(:id) must exist.
        // If they don't exist, something is really, really wrong -- since they
        // are logged in and in the session!
        if ( ! existingUsers.dictionary[id] ) {
            throw new ControllerError(500, 'server-error',
                `User(${id}) attempted to update themselves, but we couldn't find their database record!`)
        }

        const existingUser = existingUsers.dictionary[id]


        // 4. If a password is included, then oldPassword or a valid token are
        // required.
        if( user.password ) {
            // If we make it through this conditional with out throwing an
            // error, then the user is authenticated and their attempt to
            // change their password is valid.  Carry on.
            if ( authorization.token ) {
                let token = null
                try {
                    token = await this.tokenService.validateToken(authorization.token, [ TokenType.ResetPassword, TokenType.Invitation ])
                } catch (error ) {
                    if ( error instanceof DAOError ) {
                        throw new ControllerError(403, 'not-authorized:authentication-failure', error.message)
                    } else {
                        throw error
                    }
                }
                
                if ( token.userId != user.id ) {
                    throw new ControllerError(403, 'not-authorized:authentication-failure',
                        `User(${user.id}) attempted to change their password with a valid token that wasn't theirs!`)
                }

                // If this was an invitation token, then we need to update their status.
                if ( token.type == TokenType.Invitation ) {
                    user.status = UserStatus.Confirmed
                }

                await this.tokenDAO.deleteToken(token)
            } else if ( authorization.password ) {
                try {
                    const existingUserId = await this.auth.authenticateUser({ 
                        email: currentUser.email, 
                        password: authorization.password
                    })

                    if ( existingUserId != user.id) {
                        throw new ControllerError(403, 'not-authorized:authentication-failure',
                            `User(${user.id}) gave credentials that matched User(${existingUserId})!`)
                    }
                } catch (error ) {
                    if ( error instanceof ServiceError ) {
                        if ( error.type == 'authentication-failed' || error.type == 'no-user' || error.type == 'no-user-password' ) {
                            throw new ControllerError(403, 'not-authorized:authentication-failure', error.message)
                        } else if ( error.type == 'multiple-users' ) {
                            throw new ControllerError(400, 'multiple-users', error.message)
                        } else if ( error.type == 'no-credential-password' ) {
                            throw new ControllerError(400, 'no-password', error.message)
                        } else {
                            throw error
                        }
                    } else {
                        throw error
                    }
                }

                // User authenticated successfully.
            } else {
                throw new ControllerError(403, 'authentication-failure',
                    `User(${user.id}) attempted to change their password with out reauthenticating.`)
            }


            user.password  = this.auth.hashPassword(user.password)
        }

        // 5. If an email is included, then oldPassword is required.
        if ( user.email ) {
            if ( authorization.password ) {
                try {
                    const existingUserId = await this.auth.authenticateUser({ 
                        email: currentUser.email, 
                        password: authorization.password
                    })

                    if ( existingUserId != user.id) {
                        throw new ControllerError(403, 'not-authorized:authentication-failure',
                            `User(${user.id}) gave credentials that matched User(${existingUserId})!`)
                    }

                    // We're about to change their email, so the new email is
                    // unconfirmed. Make sure to update the status.
                    user.status = UserStatus.Unconfirmed
                } catch (error ) {
                    if ( error instanceof ServiceError ) {
                        if ( error.type == 'authentication-failed' || error.type == 'no-user' || error.type == 'no-user-password' ) {
                            throw new ControllerError(403, 'not-authorized:authentication-failure', error.message)
                        } else if ( error.type == 'multiple-users' ) {
                            throw new ControllerError(400, 'multiple-users', error.message)
                        } else if ( error.type == 'no-credential-password' ) {
                            throw new ControllerError(400, 'no-password', error.message)
                        } else {
                            throw error
                        }
                    } else {
                        throw error
                    }
                }

                // User authenticated successfully.
            } else {
                throw new ControllerError(403, 'authentication-failure',
                    `User(${user.id}) attempted to change their password with out reauthenticating.`)
            }
        }

        // We only need the Id.
        if ( user.file ) {
            user.fileId = user.file.id
            delete user.file
        } else if ( user.file !== undefined ) {
            delete user.file
        }

        await this.userDAO.updatePartialUser(user)

        // Issue #132 - We're going to allow the user's email to be returned in this case,
        // because only authenticated users may call this endpoint and then
        // only on themselves.
        const results = await this.userDAO.selectUsers({ where: 'users.id=$1', params: [user.id] })

        if ( ! results.dictionary[user.id] ) {
            throw new ControllerError(500, 'server-error', `Failed to find user(${user.id}) after update!`)
        }

        // If we get to this point, we know the user being updated is the same
        // as the user in the session.  No one else is allowed to update the
        // user.
        updateSessionUser(results.dictionary[user.id])

        // If we've changed the email, then we need to send out a new
        // confirmation token.
        if ( results.dictionary[user.id].email != existingUser.email ) {
            const partialToken = this.tokenService.createToken(currentUser.id, TokenType.EmailConfirmation)
            partialToken.userId = results.dictionary[user.id].id

            const tokenId = await this.tokenDAO.insertToken(partialToken)
            const tokenResults = await this.tokenDAO.selectTokens({ where: 'tokens.id = $1', params: [ tokenId] })

            await this.emailService.sendEmailConfirmation(results.dictionary[user.id], tokenResults.dictionary[tokenId])
        }


        const relations = await this.getRelations(results)

        return { 
            entity: results.dictionary[user.id],
            relations: relations
        }
    }

    /**
     * DELETE /user/:id
     *
     * Delete an existing user.
     *
     * TODO TECHDEBT This probably needs to check to see if the user we're
     * deleting is also the session user and then delete the session if they
     * are.
     *
     * NOT IMPLEMENTED.
     *
     * TODO Eventually we'll need to implement this for GDPR compliance, but we
     * need to figure out how to handle it first, since we don't want to let
     * users delete their papers once published.
     */
    async deleteUser(id: number) {
        // Currently leaving this unimplemented.  We will someday want to allow
        // users to delete themselves.  Probably some day soon.  But it is not
        // this day.  Trying to reduce the maintenance surface by removing
        // anything we're not actively using for now.
        throw new ControllerError(501, 'not-implemented', `Attempt to delete User(${id}).`)
        /*const results = await this.database.query(
            'delete from users where id = $1',
            [ request.params.id ]
        )

        if ( results.rowCount == 0) {
            return response.status(404).json({error: 'no-resource'})
        }

        return response.status(200).json({userId: request.params.id})*/
    }

} 
