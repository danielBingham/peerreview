
const AuthenticationService = require('../services/authentication')
const EmailService = require('../services/EmailService')

const TokenDAO = require('../daos/TokenDAO')
const UserDAO = require('../daos/user')

const ControllerError = require('../errors/ControllerError')
const DAOError = require('../errors/DAOError')


module.exports = class TokenController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.authenticationService = new AuthenticationService(database, logger)
        this.emailService = new EmailService(logger, config)

        this.tokenDAO = new TokenDAO(database, logger)
        this.userDAO = new UserDAO(database, logger)
    }

    async getToken(request, response) {
        if ( ! request.params.token) {
            throw new ControllerError(400, 'no-token',
                `Attempt to redeem a token with no token!`)
        }

        if ( ! request.query.type ) {
            throw new ControllerError(403, 'not-authorized:invalid-token',
                `User failed to specify a type when attempting to redeem a token.`)
        }

        let token = null
        try {
            token = await this.tokenDAO.validateToken(request.params.token, [ request.query.type ])
        } catch (error) {
            if ( error instanceof DAOError ) {
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

    async postToken(request, response) {
        const tokenParams  = request.body

        if ( tokenParams.type == 'reset-password' ) {
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
