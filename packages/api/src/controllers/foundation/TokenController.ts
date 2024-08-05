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
import { Core, ServiceError} from '@journalhub/core' 
import { User, PartialUser, UserStatus, TokenType } from '@journalhub/model'
import { DataAccess } from '@journalhub/data-access'
import { TokenService, AuthenticationService, EmailService } from '@journalhub/service'

import { ControllerError } from '../../errors/ControllerError'

export class TokenController {
    core: Core
    dao: DataAccess

    tokenService: TokenService
    authenticationService: AuthenticationService
    emailService: EmailService

    constructor(core: Core, dao: DataAccess) {
        this.core = core
        this.dao = dao

        this.tokenService = new TokenService(core)
        this.authenticationService = new AuthenticationService(core)
        this.emailService = new EmailService(core)
    }

    /**
     * GET /token/:token
     *
     * Validate a token sent to a user.
     *
     * @TODO Brute force protection.
     */
    async getToken(tokenString: string, type: TokenType): Promise<User> {

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
        if ( ! tokenString) {
            throw new ControllerError(400, 'no-token',
                `Attempt to redeem a token with no token!`)
        }

        // 2. request.query.type must be included
        if ( ! type ) {
            throw new ControllerError(403, 'not-authorized:invalid-token',
                `User failed to specify a type when attempting to redeem a token.`)
        }

        let token = null
        try {
            // TokenDAO::validateToken() checks both of the following:
            // 3. Token(:token) must be exist
            // 4. Token(:token) must have type equal to request.query.type 
            token = await this.tokenService.validateToken(tokenString, [ type ])
        } catch (error) {
            if ( error instanceof ServiceError) {
                throw new ControllerError(404, 'not-found', error.message)
            } else {
                throw error
            }
        }

        if ( token.type == TokenType.EmailConfirmation ) {
            // Log the user in.
            // Mark their user record as confirmed.

            const userUpdate: PartialUser = {
                id: token.userId,
                status: UserStatus.Confirmed 
            }
            await this.dao.user.updatePartialUser(userUpdate)
            // TODO better to hang on to it and mark it as used?
            await this.dao.token.deleteToken(token)

            return await this.authenticationService.loginUser(token.userId)
        } else if ( token.type == TokenType.ResetPassword ) {
            return await this.authenticationService.loginUser(token.userId)
        } else if ( token.type == TokenType.Invitation ) {
            return  await this.authenticationService.loginUser(token.userId)
        } else {
            throw new ControllerError(404, 'not-found',
                                      `Invalid token type.`)
        }
    }

    /**
     * POST /tokens
     *
     * Create a new token.  Currently `reset-password` tokens are the only type
     * supported by this endpoint, since invitation and email-confirmation
     * tokens are created on the...
     */
    async postToken(tokenParams: { type: TokenType, email: string }): Promise<void> {
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
        if ( tokenParams.type == TokenType.ResetPassword ) {
            // Validation: 1. A User with request.body.email must exist.
            const userResults = await this.dao.user.selectUsers({
                where: 'email=$1',
                params: [ tokenParams.email ]
            })

            if ( userResults.list.length <= 0) {
                return null
            }
            const user = userResults.dictionary[userResults.list[0]]

            const token = this.tokenService.createToken(user.id, tokenParams.type)
            token.id = await this.dao.token.insertToken(token)

            await this.emailService.sendPasswordReset(user, token.token)
        } else {
            throw new ControllerError(400, 'invalid-token',
                `Attempt to create an invalid token type.`)
        }

    }


}
