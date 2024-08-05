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
import { Core, ServiceError } from '@journalhub/core' 
import { User, PartialUser, UserStatus } from '@journalhub/model'
import { DataAccess } from '@journalhub/data-access'
import { AuthenticationService, Credentials } from '@journalhub/service'

import { ControllerError } from '../../errors/ControllerError'

/**
 * Controller for the authentication resource.
 *
 * The authentication resource represents the user's authentication state,
 * whether they are logged in or not.
 */
export class AuthenticationController {
    core: Core
    dao: DataAccess

    auth: AuthenticationService

    constructor(core: Core, dao: DataAccess) {
        this.core = core
        this.dao = dao

        this.auth = new AuthenticationService(core)
    }


    /**
     * GET /authentication
     *
     * Check the session and get the user (or null) and their settings.
     */
    async getAuthentication(currentUser: User): Promise<User|null> {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  It simply checks the session and
         * returns what it finds.
         * 
         * **********************************************************/
        if (currentUser) {
            return currentUser
        } else {
            return null
        }
    }

    /**
     * POST /authentication
     *
     * Used to authenticate a user using the credentials provided in the
     * request body, and logs them into the application, storing their user
     * object in the session.
     */
    async postAuthentication(
        credentials: Credentials
    ): Promise<User> {
        credentials.email = credentials.email.toLowerCase()

        /************************************************************
         *  This is the authentication endpoint, so anyone may call it.
         *  Authentication checks happen in
         *  AuthenticationService::authenticateUser()
         ************************************************************/
        try {
            const userId = await this.auth.authenticateUser(credentials)
            return await this.auth.loginUser(userId)
        } catch (error ) {
            if ( error instanceof ServiceError ) {
                if ( error.type == 'no-user' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type == 'multiple-users') {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type == 'no-user-password' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type == 'no-credential-password' ) {
                    throw new ControllerError(400, 'password-required', error.message)
                } else if ( error.type == 'authentication-failed' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else {
                    throw error
                }
            } else {
                throw error 
            }
        }
    }

    /**
     * PATCH /authentication
     *
     * Can be used to check a user's authentication with out modifying the
     * session.
     */
    async patchAuthentication(credentials: Credentials): Promise<User> {
        credentials.email = credentials.email.toLowerCase()

        /************************************************************
         *  This is the endpoint for validating an existing authentication, so
         *  anyone may call it.  Authentication checks happen in
         *  AuthenticationService::authenticateUser()
         ************************************************************/

        try {
            const userId = await this.auth.authenticateUser(credentials)

            const userResults = await this.dao.user.selectUsers({
                where: 'users.id = $1', 
                params: [ userId ]
            })

            if ( ! userResults.dictionary[userId] ) {
                throw new ControllerError(500, 'server-error', 
                    `Failed to find User(${userId}) after authenticating them!`)
            }

            return userResults.dictionary[userId]
        } catch (error ) {
            if ( error instanceof ServiceError ) {
                if ( error.type == 'no-user' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type == 'multiple-users') {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type == 'no-user-password' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type == 'no-credential-password' ) {
                    throw new ControllerError(400, 'password-required', error.message)
                } else if ( error.type == 'authentication-failed' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else {
                    throw error
                }
            } else {
                throw error 
            }
        }
    }

    /**
     * DELETE /authentication
     *
     * Destroy the session and logout the user.
     */
    async deleteAuthentication(): Promise<void> {
        /**********************************************************************
         * This endpoint simply destroys the session, logging out the user.
         * Anyone may call it.
         **********************************************************************/
        try { 
            await this.core.session.destroy()   
        } catch (error) {
            throw new ControllerError(500, 'server-error',
                `Failed to destroy the session.`)
        }
    }

    /**
     * POST /orcid/authentication
     * 
     * Authenticate a user through ORCID iD, using their ORCID iD.  This is an
     * OAuth SSO.
     *
     * This endpoint can be called in a couple of different circumstances and
     * needs to handle each one:
     *
     * - It can be called during registration, to create the user account using
     *   their ORCID account.
     * - It can be called by a logged in user to connect their ORCID iD to
     *   their Peer Review account, allowing them to login with ORCID in the
     *   future.
     * - It can be called to login a user who previously registered with ORCID
     *   or connected their ORCID to their account.
     */
    async postOrcidAuthentication(currentUser: User, body: { code: string, connect: boolean }): Promise<{ user: User, type: string }> {

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * This being the ORCID iD authentication endpoint, we only need to
         * validate that they have sent an ORCID authorization code in the
         * request body.
         *
         * 1. The request body contains an ORCID authorization code.
         * **********************************************************/

        // 1. The request body contains an ORCID authorization code.
        if ( ! body.code ) {
            throw new ControllerError(400, 'no-authorization-code', `User attempted orcid authentication with no authorization code!`)
        }

        const authorizationRequestParams= new URLSearchParams({
            client_id:  this.core.config.orcid.client_id,
            client_secret: this.core.config.orcid.client_secret,
            grant_type:  'authorization_code',
            code:  body.code,
            redirect_uri: body.connect ? this.core.config.orcid.connect_redirect_uri : this.core.config.orcid.authentication_redirect_uri
        })
        const data = authorizationRequestParams.toString()

        const authorizationResponse = await fetch(this.core.config.orcid.authorization_host + '/oauth/token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data
        })

        if ( ! authorizationResponse.ok ) {
            // TODO Orcid returns more detailed errors in the json, we should
            // parse it and read those to give better errors back to the user.
            const errors = await authorizationResponse.json()
            console.error(errors)
            throw new ControllerError(403, 'not-authorized', `Authorization request failed.`)
        }

        const orcidAuthorization = await authorizationResponse.json()
        const orcidId = orcidAuthorization.orcid

        const orcidResults = await this.core.database.query(`
                SELECT users.id FROM users WHERE users.orcid_id = $1
            `, [ orcidId])

        // If we have a user logged in, then this is a request to connect their
        // accounts. 
        //
        //  If we have orcidResults, then that means this ORCID iD is already
        //  linked to an account - either this one or another one. 
        if ( currentUser &&  orcidResults.rows.length <= 0 ) {
            const responseBody = await this.auth.connectOrcid(currentUser.id, orcidId)
            return responseBody
        } else if ( currentUser ) {
            throw new ControllerError(400, 'already-linked',
                `User(${currentUser.id}) attempting to link ORCID iD (${orcidId}) already connected to User(${orcidResults.rows[0].id}).`)
        }


        // We have the user registered and linked to their orcid account
        // - Find the user by their orcid id.
        // -- Just log them in.
        if ( orcidResults.rows.length == 1 ) {
            const fullUser = await this.auth.loginUser(orcidResults.rows[0].id)
            return {
                type: "login",
                user: fullUser
            }
        } else if ( orcidResults.rows.length > 1 ) {
            throw new ControllerError(500, 'server-error', `Multiple users(${ orcidResults.rows.map((r) => r.id).join(',') }) with the same Orcid.  How did that happen?!`)
        }

        // get their full record
        const recordResponse = await fetch(this.core.config.orcid.api_host + '/v3.0/' + orcidAuthorization.orcid, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.orcid+json',
                'Authorization': `Bearer ${orcidAuthorization.access_token}`
            }
        })

        if ( ! recordResponse.ok ) {
            throw new ControllerError(500, 'server-error', `Failed to retrieve ORCID record for ${orcidId}.`)                 
        }
        const orcidRecord = await recordResponse.json()

        let where = ''
        let params = [] 
        let count = 0

        const emails = orcidRecord.person.emails.email

        // We can't register them or connect their accounts with out a
        // visible email.
        if ( emails.length <= 0) {
            throw new ControllerError(400, 'no-visible-email', `Can't register orcid user(Orcid:${orcidId}) with out a visible email.`)
        }

        for ( const email of emails) {
            const or = count > 0 ? ' OR ' : ''
            count += 1
            where += `${or} users.email = $${count}`
            params.push(email.email)
        }

        const userResults = await this.core.database.query(`
                    SELECT users.id FROM users
                        WHERE ${where}
                 `, params)

        let primary_email = null 
        for (const email of emails) {
            if ( email.primary ) {
                primary_email = email.email
            }
        }

        if ( ! primary_email ) {
            primary_email = emails[0].email
        }

        // We don't have the user registered yet.
        // - No orcid id
        // - None of the emails.
        // -- Register them and then log them in.
        if ( userResults.rows.length <= 0) {
            const user: PartialUser = {
                name: orcidRecord.person.name["given-names"].value + ' ' + orcidRecord.person.name["family-name"].value,
                email: primary_email,
                status: UserStatus.Confirmed,
                orcidId: orcidId,
                institution: '',
                password: null,
                bio: '',
                location: ''
            }
            user.id = await this.dao.user.insertUser(user)
            await this.dao.user.updatePartialUser(user)

            const fullUser = await this.auth.loginUser(user.id)
            return {
                user: fullUser,
                type: "registration"
            }
        }

        // We have the user registered with one of the emails
        // - find them by email
        // - They haven't linked their orcid id yet
        // -- Log them in and link their orcid 
        if ( userResults.rows.length == 1) {
            const id = userResults.rows[0].id

            const user: PartialUser = {
                id: id,
                orcidId: orcidId,
                status: UserStatus.Confirmed 
            }
            await this.dao.user.updatePartialUser(user)

            const fullUser = await this.auth.loginUser(id)
            return {
                user: fullUser,
                type: "connection"
            }
        }

        // The user has registered multiple accounts with different emails
        // - We get multiple users, merge them.
        if ( userResults.rows.length > 1 ) {
            throw new ControllerError(501, 'multiple-user-merging-unimplemented', `Found multiple user accounts, but we haven't implemented merging yet!`)
        } else {
            throw new ControllerError(500, 'unhandled-case',
                `Unhandled case in ORCID registration flow.`)
        }
    
    }
}

