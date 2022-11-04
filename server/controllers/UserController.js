/******************************************************************************
 *      UserController
 *
 * Restful routes for manipulating users.
 *
 ******************************************************************************/

const AuthenticationService = require('../services/authentication')
const EmailService = require('../services/EmailService')

const UserDAO = require('../daos/user')
const SettingsDAO = require('../daos/settings')
const TokenDAO = require('../daos/TokenDAO')

const ControllerError = require('../errors/ControllerError')
const DAOError = require('../errors/DAOError')
const ServiceError = require('../errors/ServiceError')

module.exports = class UserController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.auth = new AuthenticationService(database, logger)
        this.emailService = new EmailService(logger, config)

        this.userDAO = new UserDAO(database)
        this.settingsDAO = new SettingsDAO(database, logger)
        this.tokenDAO = new TokenDAO(database, logger)
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
    async parseQuery(query, options) {
        options = options || {
            ignorePage: false
        }

        if ( ! query) {
            return
        }

        let count = 0

        const result = {
            where: 'WHERE',
            params: [],
            page: 1,
            order: '',
            emptyResult: false
        }

        if ( query.name && query.name.length > 0) {
            count += 1
            const and = count > 1 ? ' AND ' : ''
            result.where += `${and} SIMILARITY(users.name, $${count}) > 0`
            result.params.push(query.name)
            result.order = `SIMILARITY(users.name, $${count}) desc`
        }

        if ( query.page && ! options.ignorePage ) {
            result.page = query.page
        } else if ( ! options.ignorePage ) {
            result.page = 1
        }

        if ( query.sort == 'reputation' ) {
            result.order = 'users.reputation desc'
        }


        // If we haven't added anything to the where clause, then clear it.
        if ( result.where == 'WHERE') {
            result.where = ''
        }

        return result

    }

    /**
     * GET /users
     *
     * Respond with a list of `users` matching the query in the meta/result
     * format.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.query.name   (Optional) A string to compare to
     * user's names for matches.  Compared using trigram matching.
     * @param {int} request.query.page    (Optional) A page number indicating
     * which page of results we want.  
     * @param {string} request.query.sort (Optional) A sort parameter
     * describing how we want to sort users.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getUsers(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Anyone may call this endpoint.
         * 
         * **********************************************************/

        const { where, params, order, page, emptyResult } = await this.parseQuery(request.query)

        if ( emptyResult ) {
            return response.status(200).json({
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: 1,
                    numberOfPages: 1
                }, 
                result: []
            })
        }
        const meta = await this.userDAO.countUsers(where, params, page)
        const users = await this.userDAO.selectCleanUsers(where, params, order, page)

        return response.status(200).json({
            meta: meta,
            result: users
        })
    }

    /**
     * POST /users
     *
     * Create a new `user`.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body The user definition.
     * @param {string} request.body.email   The user's email.
     * @param {string} request.body.name    The users's name.
     * @param {string} request.body.password    (Optional) The user's password.  Required if no user is logged in.
     * @param {string} request.body.institution (Optional) The user's institution.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postUsers(request, response) {
        const user = request.body

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

        const loggedInUser = request.session.user

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
            user.status = 'unconfirmed'
        } else if ( loggedInUser ) {
            user.status = 'invited'
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

        const returnUsers = await this.userDAO.selectCleanUsers('WHERE users.id=$1', [user.id])

        if ( returnUsers.length <= 0) {
            throw new ControllerError(500, 'server-error', `No user found after insertion. Looking for id ${user.id}.`)
        }

        if ( loggedInUser ) {
            const token = this.tokenDAO.createToken('invitation')
            token.userId = returnUsers[0].id
            token.id = await this.tokenDAO.insertToken(token)

            this.emailService.sendInvitation(loggedInUser,returnUsers[0], token)
        } else {
            const token = this.tokenDAO.createToken('email-confirmation')
            token.userId = returnUsers[0].id
            token.id = await this.tokenDAO.insertToken(token)

            this.emailService.sendEmailConfirmation(returnUsers[0], token)
        }

        await this.settingsDAO.initializeSettingsForUser(returnUsers[0])

        return response.status(201).json(returnUsers[0])
    }

    /**
     * GET /user/:id
     *
     * Get details for a single user in thethis.database.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The id of the user we wish to retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getUser(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Anyone may call this endpoint.
         * 
         * **********************************************************/
        const returnUsers = await this.userDAO.selectCleanUsers('WHERE users.id = $1', [request.params.id])

        if ( returnUsers.length == 0 ) {
            throw new ControllerError(404, 'not-found', `User(${request.params.id}) not found.`)
        }

        return response.status(200).json(returnUsers[0])
    }

    /**
     * PUT /user/:id
     *
     * Replace an existing user wholesale with the provided JSON.
     *
     * NOT IMPLEMENTED.
     */
    async putUser(request, response) {
        // We're not using this right now and can't think of a situation where
        // we would use it.  So for now, it's being marked unimplemented and
        // ignored.  
        throw new ControllerError(501, 'not-implemented', `Attempt to call unimplemented PUT /user for user(${request.params.id}).`)
        /*const user = request.body
        user.password = this.auth.hashPassword(user.password)

        const results = await this.database.query(`
                    UPDATE users SET name = $1 AND email = $2 AND password = $3 AND updated_date = now() 
                        WHERE id = $4 
                        RETURNING id
                `,
            [ user.name, user.email, user.password, request.params.id ]
        )

        if (results.rowCount == 0 && results.rows.length == 0) {
            return response.status(404).json({error: 'no-resource'})
        }

        const returnUsers = await this.userDAO.selectUsers('WHERE users.id=$1', results.rows[0].id)
        if ( returnUsers.length == 0 ) {
            throw new Error('Updated user somehow does not exist.')
        }

        if ( request.session && request.session.user && request.session.user.id == returnUsers[0].id) {
            request.session.user = returnUsers[0]
        }
        return response.status(200).json(returnUsers[0]) */
    }

    /**
     * PATCH /user/:id
     *
     * Update an existing user from a patch.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The id of the user we wish to update.
     * @param {Object} request.body The patch we wish to user to update the
     * user.  May include any fields from the `user` object.  Some fields come
     * with additional requirements, noted below.
     * @param {string} request.body.password    (Optional) If this field is
     * included then the body must also include either an `oldPassword` field
     * or a `token` corresponding to either a valid 'reset-password' token or a
     * valid 'invitation' token.
     * @param {string} request.body.token Required if `request.body.password`
     * is included and `request.body.oldPassword` is not.
     * @param {string} request.body.oldPassword Required if
     * `request.body.password` is included and `request.body.token` is not.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchUser(request, response) {
        const user = request.body
        const id = request.params.id

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
        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', 
                `Unauthenticated user attempting to update user(${user.id}).`)
        } 

        // 2. User being patched must be the same as the logged in user.
        // 2a. :id must equal request.session.user.id
        //
        // NOTE: If this requirement changes (to allow admins to patch users,
        // for instance), then make sure to strip the email out of the returned
        // user at the botton of this function.  Or at least, spend some time
        // considering whether you need to.
        if ( request.session.user.id != id) {
            throw new ControllerError(403, 'not-authorized', 
                `User(${request.session.user.id}) attempted to update another user(${id}).`)
        }

        // 2. User being patched must be the same as the logged in user.
        // 2b. :id must equal request.body.id
        if ( id != user.id ) {
            throw new ControllerError(403, 'not-authorized:id-mismatch',
                `User(${id}) attempted to update another User(${user.id}).`)
        }
        const existingUsers = await this.userDAO.selectUsers(`WHERE users.id = $1`, [ id ] )

        // 3. User(:id) must exist.
        // If they don't exist, something is really, really wrong -- since they
        // are logged in and in the session!
        if ( existingUsers.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `User(${id}) attempted to update themselves, but we couldn't find their database record!`)
        }

        const existingUser = existingUsers[0]


        // 4. If a password is included, then oldPassword or a valid token are
        // required.
        if( user.password ) {
            // If we make it through this conditional with out throwing an
            // error, then the user is authenticated and their attempt to
            // change their password is valid.  Carry on.
            if ( user.token ) {
                let token = null
                try {
                    token = await this.tokenDAO.validateToken(user.token, [ 'reset-password', 'invitation' ])
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
                if ( token.type == 'invitation' ) {
                    user.status = 'confirmed'
                }

                await this.tokenDAO.deleteToken(token)
                // Token was valid.  Clean it off the user object before we use
                // it as a patch.
                delete user.token
            } else if ( user.oldPassword ) {
                try {
                    const existingUserId = await this.auth.authenticateUser({ 
                        email: request.session.user.email, 
                        password: user.oldPassword
                    })

                    if ( existingUserId != user.id) {
                        throw new ControllerError(403, 'not-authorized:authentication-failure',
                            `User(${user.id}) gave credentials that matched User(${existingUserId})!`)
                    }

                    // OldPassword was valid and the user successfully
                    // authenticated. Now clean it off the user object before
                    // we use it as a patch.
                    delete user.oldPassword
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


            user.password  = await this.auth.hashPassword(user.password)
        }

        // 5. If an email is included, then oldPassword is required.
        if ( user.email ) {
            if ( user.oldPassword ) {
                try {
                    const existingUserId = await this.auth.authenticateUser({ 
                        email: request.session.user.email, 
                        password: user.oldPassword
                    })

                    if ( existingUserId != user.id) {
                        throw new ControllerError(403, 'not-authorized:authentication-failure',
                            `User(${user.id}) gave credentials that matched User(${existingUserId})!`)
                    }

                    // We're about to change their email, so the new email is
                    // unconfirmed. Make sure to update the status.
                    user.status = 'unconfirmed'

                    // OldPassword was valid and the user successfully
                    // authenticated. Now clean it off the user object before
                    // we use it as a patch.
                    delete user.oldPassword
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
        const returnUsers = await this.userDAO.selectUsers('WHERE users.id=$1', [user.id])

        if ( returnUsers.length <= 0 ) {
            throw new ControllerError(500, 'server-error', `Failed to find user(${user.id}) after update!`)
        }

        // If we get to this point, we know the user being updated is the same
        // as the user in the session.  No one else is allowed to update the
        // user.
        request.session.user = returnUsers[0]

        // If we've changed the email, then we need to send out a new
        // confirmation token.
        if ( returnUsers[0].email != existingUser.email ) {
            const token = this.tokenDAO.createToken('email-confirmation')
            token.userId = returnUsers[0].id
            token.id = await this.tokenDAO.insertToken(token)

            this.emailService.sendEmailConfirmation(returnUsers[0], token)
        }


        return response.status(200).json(returnUsers[0])
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
    async deleteUser(request, response) {
        // Currently leaving this unimplemented.  We will someday want to allow
        // users to delete themselves.  Probably some day soon.  But it is not
        // this day.  Trying to reduce the maintenance surface by removing
        // anything we're not actively using for now.
        throw new ControllerError(501, 'not-implemented', `Attempt to delete User(${request.params.id}).`)
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
