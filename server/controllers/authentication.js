/******************************************************************************
 * Authentication Controller
 *
 * Provides endpoints to authenticate a user.
 *
 * ***************************************************************************/

const AuthenticationService = require('../services/authentication')
const UserDAO = require('../daos/user')
const SettingsDAO = require('../daos/settings')

const ControllerError = require('../errors/ControllerError')

module.exports = class AuthenticationController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.auth = new AuthenticationService(database, logger)
        this.userDAO = new UserDAO(database)
        this.settingsDAO = new SettingsDAO(database)
    }


    async getAuthentication(request, response) {
        if (request.session.user) {
            const settings = await this.settingsDAO.selectSettings('WHERE user_settings.user_id = $1', [ request.session.user.id ])
            if ( settings.length == 0 ) {
                throw new ControllerError(500, 'server-error', `Failed to retrieve settings for authenticated user ${request.session.user.id}.`)
            }
            return response.status(200).json({
                user: request.session.user,
                settings: settings[0] 
            })

        } else {
            return response.status(200).json({
                user: null,
                settings: request.session.settings
            })
        }
    }

    async postAuthentication(request, response) {
        const credentials = request.body

        const results = await this.database.query(
            'select id,password from users where email = $1',
            [ credentials.email ]
        )

        if ( results.rows.length <= 0) {
            throw new ControllerError(403, 'authentication-failed', `No users exist with email ${credentials.email}.`)
        }

        if (results.rows.length > 1 ) {
            throw new ControllerError(403, 'authentication-failed', `Multiple users found for email ${credentials.email}.`)
        }

        if ( ! results.rows[0].password || results.rows[0].password.trim().length <= 0) {
            throw new ControllerError(400, 'no-password', `User(${credentials.email}) doesn't have a password set.`)
        }

        if ( ! credentials.password || credentials.password.trim().length <= 0 ) {
            throw new ControllerError(400, 'password-required', `User(${credentials.email}) attempted to login with no password.`)
        }

        const userMatch = results.rows[0]
        const passwords_match = this.auth.checkPassword(credentials.password, userMatch.password)
        if (! passwords_match) {
            throw new ControllerError(403, 'authentication-failed', `Failed login for email ${credentials.email}.`)
        }

        const responseBody = await this.auth.loginUser(userMatch.id, request)
        return response.status(200).json(responseBody)
    }

    /**
     * Can be used to check a user's authentication with out modifying the
     * session.
     */
    async patchAuthentication(request, response) {
        const credentials = request.body

        const results = await this.database.query(
            'select id,password from users where email = $1',
            [ credentials.email ]
        )

        if (results.rows.length != 1 ) {
            throw new ControllerError(403, 'authentication-failed', `Multiple users found for email ${credentials.email}.`)
        }
        if ( ! results.rows[0].password || results.rows[0].password.trim().length <= 0) {
            throw new ControllerError(400, 'no-password', `User(${credentials.email}) doesn't have a password set.`)
        }
        if ( ! credentials.password || credentials.password.trim().length <= 0 ) {
            throw new ControllerError(400, 'password-required', `User(${credentials.email}) attempted to login with no password.`)
        }

        const userMatch = results.rows[0]
        const passwords_match = this.auth.checkPassword(credentials.password, userMatch.password)
        if (! passwords_match) {
            throw new ControllerError(403, 'authentication-failed', `Failed login for email ${credentials.email}.`)
        }

        const users = await this.userDAO.selectUsers('WHERE users.id=$1', [userMatch.id])
        if ( ! users ) {
            throw new ControllerError(500, 'server-error', `Failed to retrieve full record for authenticated user(${userMatch.id}).`)
        } 

        return response.status(200).json(users[0])
    }

    deleteAuthentication(request, response) {
        request.session.destroy(function(error) {
            if (error) {
                console.error(error)
                response.status(500).json({error: 'server-error'})
            } else {
                response.status(200).json(null)
            }
        })
    }

    async postOrcidAuthentication(request, response) {
        if ( ! request.body.code ) {
            throw new ControllerError(400, 'no-authorization-code', `User attempted orcid authentication with no authorization code!`)
        }

        const authorizationRequestParams= new URLSearchParams({
            client_id:  this.config.orcid.client_id,
            client_secret: this.config.orcid.client_secret,
            grant_type:  'authorization_code',
            code:  request.body.code,
            redirect_uri: request.body.connect ? this.config.orcid.connect_redirect_uri : this.config.orcid.authentication_redirect_uri
        })
        const data = authorizationRequestParams.toString()

        const authorizationResponse = await fetch(this.config.orcid.authorization_host + '/oauth/token', {
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

        const orcidResults = await this.database.query(`
                SELECT users.id FROM users WHERE users.orcid_id = $1
            `, [ orcidId])

        // If we have a user logged in, then this is a request to connect their
        // accounts. 
        //
        //  If we have orcidResults, then that means this ORCID iD is already
        //  linked to an account - either this one or another one. 
        if ( request.session.user &&  orcidResults.rows.length <= 0 ) {
            const user = {
                id: request.session.user.id,
                orcidId: orcidId
            }
            await this.userDAO.updatePartialUser(user)

            // Initialize their reputation.
            const responseBody = await this.auth.loginUser(request.session.user.id, request)
            responseBody.type = "connection"
            return response.status(200).json(responseBody)
        } else if ( request.session.user ) {
            throw new ControllerError(400, 'already-linked',
                `User(${request.sesison.user.id}) attempting to link ORCID iD (${orcidId}) already connected to User(${orcidResults.rows[0].id}).`)
        }


        // We have the user registered and linked to their orcid account
        // - Find the user by their orcid id.
        // -- Just log them in.
        if ( orcidResults.rows.length == 1 ) {
            const responseBody = await this.auth.loginUser(orcidResults.rows[0].id, request)
            responseBody.type = "login"
            return response.status(200).json(responseBody)    
        } else if ( orcidResults.rows.length > 1 ) {
            throw new ControllerError(500, 'server-error', `Multiple users(${ orcidResults.rows.map((r) => r.id).join(',') }) with the same Orcid.  How did that happen?!`)
        }

        // get their full record
        const recordResponse = await fetch(this.config.orcid.api_host + '/v3.0/' + orcidAuthorization.orcid, {
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

        const userResults = await this.database.query(`
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
            const user = {
                name: orcidRecord.person.name["given-names"].value + ' ' + orcidRecord.person.name["family-name"].value,
                email: primary_email,
                orcidId: orcidId,
                institution: '',
                password: null,
                bio: '',
                location: ''
            }
            user.id = await this.userDAO.insertUser(user)
            await this.userDAO.updatePartialUser(user)

            await this.settingsDAO.initializeSettingsForUser(user)
            // Initialize their reputation

            const responseBody = await this.auth.loginUser(user.id, request)
            responseBody.type = "registration"
            return response.status(200).json(responseBody)
        }

        // We have the user registered with one of the emails
        // - find them by email
        // - They haven't linked their orcid id yet
        // -- Log them in and link their orcid 
        if ( userResults.rows.length == 1) {
            const id = userResults.rows[0].id

            const user = {
                id: id,
                orcidId: orcidId
            }
            await this.userDAO.updatePartialUser(user)
            // initialize their reputation.

            const responseBody = await this.auth.loginUser(id, request)
            responseBody.type = "connection"
            return response.status(200).json(responseBody)
        }

        // The user has registered multiple accounts with different emails
        // - We get multiple users, merge them.
        if ( userResults.rows.length > 1 ) {
            console.log('Multiple users.  Merging them.')
            throw new ControllerError(501, 'multiple-user-merging-unimplemented', `Found multiple user accounts, but we haven't implemented merging yet!`)
        }
    
    }
}

