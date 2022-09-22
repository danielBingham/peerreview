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

module.exports = class UserController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.auth = new AuthenticationService()
        this.emailService = new EmailService(logger, config)

        this.userDAO = new UserDAO(database)
        this.settingsDAO = new SettingsDAO(database, logger)
        this.tokenDAO = new TokenDAO(database, logger)
    }

    /**
     * GET /users
     *
     * Return a JSON array of all users in thethis.database.
     */
    async getUsers(request, response) {
        let where = 'WHERE'
        let params = []
        if ( request.query.name && request.query.name.length > 0) {
            where += ` users.name ILIKE $1`
            params.push(request.query.name+"%")
        }
        if ( where == 'WHERE') {
            where = ''
        }
        const users = await this.userDAO.selectUsers(where, params)
        return response.status(200).json(users)
    }

    /**
     * POST /users
     *
     * Create a new user in the this.database from the provided JSON.
     */
    async postUsers(request, response) {
        const user = request.body

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

        user.password = this.auth.hashPassword(user.password)

        user.id = await this.userDAO.insertUser(user)

        const returnUsers = await this.userDAO.selectUsers('WHERE users.id=$1', [user.id])

        if ( returnUsers.length <= 0) {
            throw new ControllerError(500, 'server-error', `No user found after insertion. Looking for id ${user.id}.`)
        }

        const token = this.tokenDAO.createToken('email-confirmation')
        token.userId = returnUsers[0].id
        token.id = await this.tokenDAO.insertToken(token)

        this.emailService.sendEmailConfirmation(returnUsers[0], token)

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
            user.password  = await this.auth.hashPassword(user.password)
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
