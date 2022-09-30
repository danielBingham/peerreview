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
     * Return a JSON array of all users in thethis.database.
     */
    async getUsers(request, response) {
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
        const users = await this.userDAO.selectUsers(where, params, order, page)
        return response.status(200).json({
            meta: meta,
            result: users
        })
    }

    /**
     * POST /users
     *
     * Create a new user in the this.database from the provided JSON.
     */
    async postUsers(request, response) {
        const user = request.body

        const loggedInUser = request.session.user

        // If a user already exists with that email, send a 409 Conflict
        // response.
        //
        const userExistsResults = await this.database.query(
            'SELECT id, email FROM users WHERE email=$1',
            [ user.email ]
        )

        if (userExistsResults.rowCount > 0) {
            throw new ControllerError(409, 'user-exists', `Attempting to create a user(${userExistsResults.rows[0].id}) that already exists!`)
        }

        // If we're creating a user with a password, then this is just a normal
        // unconfirmed user creation.  However, if we're creating a user
        // without a password, then this is a user who is being invited.
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

        const returnUsers = await this.userDAO.selectUsers('WHERE users.id=$1', [user.id])

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
     */
    async getUser(request, response) {
        const returnUsers = await this.userDAO.selectUsers('WHERE users.id = $1', [request.params.id])

        if ( returnUsers.length == 0 ) {
            throw new ControllerError(404, 'not-found', `User(${request.params.id}) not found.`)
        }

        return response.status(200).json(returnUsers[0])
    }

    /**
     * PUT /user/:id
     *
     * Replace an existing user wholesale with the provided JSON.
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
     * Update an existing user given a partial set of fields in JSON.
     */
    async patchUser(request, response) {
        const user = request.body
        user.id = request.params.id

        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `Unauthenticated user attempting to update user(${user.id}).`)
        } else if ( request.session.user.id != user.id) {
            throw new ControllerError(403, 'not-authorized', `User(${request.session.user.id}) attempted to update another user(${user.id}).`)
        }

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
                let existingUser = null
                try {
                    existingUser = await this.auth.authenticateUser({ 
                        email: request.session.user.email, 
                        password: user.oldPassword
                    })

                    if ( existingUser.id != user.id) {
                        throw new ControllerError(403, 'not-authorized:authentication-failure',
                            `User(${user.id}) gave credentials that matched User(${existingUser.id})!`)
                    }

                    // OldPassword was valid and the user successfully
                    // authenticated. Now clean it off the user object before
                    // we use it as a patch.
                    delete user.oldPassword
                } catch (error ) {
                    if ( error instanceof ServiceError ) {
                        if ( error.type == 'authentication-failed' || error.type == 'no-user-password' ) {
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

        // We only need the Id.
        if ( user.file ) {
            user.fileId = user.file.id
            delete user.file
        }

        await this.userDAO.updatePartialUser(user)

        const returnUsers = await this.userDAO.selectUsers('WHERE users.id=$1', [user.id])

        if ( returnUsers.length <= 0 ) {
            throw new ControllerError(500, 'server-error', `Failed to find user(${user.id}) after update!`)
        }

        // If we get to this point, we know the user being updated is the same
        // as the user in the session.  No one else is allowed to update the
        // user.
        request.session.user = returnUsers[0]

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
