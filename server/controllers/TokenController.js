
const AuthenticationService = require('../services/authentication')

const TokenDAO = require('../daos/TokenDAO')
const UserDAO = require('../daos/user')

module.exports = class TokenController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.authenticationService = new AuthenticationService(database, logger)

        this.tokenDAO = new TokenDAO(database, logger)
        this.userDAO = new UserDAO(database, logger)
    }

    async getToken(request, response) {
        if ( ! request.params.token) {
            throw new ControllerError(400, 'no-token',
                `Attempt to redeem a token with no token!`)
        }

        const tokens = await this.tokenDAO.selectTokens('WHERE tokens.token = $1', [ request.params.token ])

        if ( tokens.length <= 0 ) {
            throw new ControllerError(400, 'invalid-token',
                `Attempt to redeem a non-existent token.`)
        }

        const token = tokens[0] 

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

            const users = this.userDAO.selectUsers('WHERE users.id = $1', [ token.userId ]) 
            const responseBody = await this.authenticationService.loginUser(token.userId, request)

            return response.status(200).json(responseBody)
        }
    }

    async postToken(request, response) {

    }


}
