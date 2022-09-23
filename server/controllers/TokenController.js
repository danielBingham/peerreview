
const AuthenticationService = require('../services/authentication')

const TokenDAO = require('../daos/TokenDAO')
const UserDAO = require('../daos/user')

const TOKEN_TTL = {
    'email-confirmation': 1000*60*60*24, // 1 day
    'reset-password': 1000*60*30, // 30 minutes
    'invitation': 1000*60*60*24*30 // 1 month
}

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

        // Token lifespan.
        const createdDate = new Date(token.createdDate)
        const createdDateMs = createdDate.getTime()
        if ( createdDateMs > TOKEN_TTL[token.type]) {
            throw new ControllerError(400, 'invalid-token',
                `Attempt to redeem an expired token.`)
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

            const users = this.userDAO.selectUsers('WHERE users.id = $1', [ token.userId ]) 
            const responseBody = await this.authenticationService.loginUser(token.userId, request)

            return response.status(200).json(responseBody)
        }
    }

    async postToken(request, response) {

    }


}
