const backend = require('@peerreview/backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class TokenController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.authenticationService = new backend.AuthenticationService(database, logger)
        this.emailService = new backend.EmailService(logger, config)

        this.tokenDAO = new backend.TokenDAO(database, logger)
        this.userDAO = new backend.UserDAO(database, logger)
    }

    /**
     * GET /token/:token
     *
     * Validate a token sent to a user.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.params.token The token we want to validate.
     * @param {string} request.query.type   The type of token we are trying to
     * validate.  Must match what's in the database for :token.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getToken(request, response) {

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         * No permissions for this endpoint.  Anyone can hit it, the
         * permissions come from the token and its validation.
         *
         * Validation:
         * 1. :token must be included.
         * 2. request.query.type must be included
         * 3. Token(:token) must be exist
         * 4. Token(:token) must have type equal to request.query.type 
         * 
         * **********************************************************/

        // 1. :token must be included.
        if ( ! request.params.token) {
            throw new ControllerError(400, 'no-token',
                `Attempt to redeem a token with no token!`)
        }

        // 2. request.query.type must be included
        if ( ! request.query.type ) {
            throw new ControllerError(403, 'not-authorized:invalid-token',
                `User failed to specify a type when attempting to redeem a token.`)
        }

        let token = null
        try {
            // TokenDAO::validateToken() checks both of the following:
            // 3. Token(:token) must be exist
            // 4. Token(:token) must have type equal to request.query.type 
            token = await this.tokenDAO.validateToken(request.params.token, [ request.query.type ])
        } catch (error) {
            if ( error instanceof backend.DAOError ) {
                throw new ControllerError(403, 'not-authorized:invalid-token', error.message)
            } else {
                throw error
            }
        }

        if ( token.type == 'email-confirmation' ) {
            // Log the user in.
            // Mark their user record as confirmed.

            const userUpdate = {
                id: token.userId,
                status: 'confirmed'
            }
            await this.userDAO.updatePartialUser(userUpdate)
            // TODO better to hang on to it and mark it as used?
            await this.tokenDAO.deleteToken(token)

            const responseBody = await this.authenticationService.loginUser(token.userId, request)

            return response.status(200).json(responseBody)
        } else if ( token.type == 'reset-password' ) {
            const responseBody = await this.authenticationService.loginUser(token.userId, request)
            return response.status(200).json(responseBody)
        } else if ( token.type == 'invitation' ) {
            const responseBody = await this.authenticationService.loginUser(token.userId, request)
            return response.status(200).json(responseBody)
        }
    }

    /**
     * POST /tokens
     *
     * Create a new token.  Currently `reset-password` tokens are the only type
     * supported by this endpoint, since invitation and email-confirmation
     * tokens are created on the backend.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body The parameters used to create the
     * token.
     * @param {string} request.body.type    The type of token we wish to
     * create.  Currently only 'reset-password' is supported.
     * @param {string} request.body.email   The email for which we are creating
     * a password reset token.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postToken(request, response) {
        const tokenParams  = request.body

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         * Anyone may hit this endpoint to create a reset password token.
         *
         * Validation:
         * 1. A User with request.body.email must exist.
         * 2. request.body.type must be 'reset-password'
         *
         * TODO Rate limit (only x requests per Y period)
         * 
         * **********************************************************/

        // Validation: 2. request.body.type must be 'reset-password'
        if ( tokenParams.type == 'reset-password' ) {
            // Validation: 1. A User with request.body.email must exist.
            const users = await this.userDAO.selectUsers('WHERE email=$1', [ tokenParams.email ])

            if ( users.length <= 0) {
                return response.status(200).json(null)
            }
            const user = users[0]

            const token = this.tokenDAO.createToken(tokenParams.type)
            token.userId = user.id
            token.id = await this.tokenDAO.insertToken(token)

            this.emailService.sendPasswordReset(user, token)

            return response.status(200).json(null)
        } else {
            throw new ControllerError(400, 'invalid-token',
                `Attempt to create an invalid token type.`)
        }

    }


}
