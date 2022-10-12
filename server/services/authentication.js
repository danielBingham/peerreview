const bcrypt = require('bcrypt');

const ServiceError = require('../errors/ServiceError')

const UserDAO = require('../daos/user')
const SettingsDAO = require('../daos/settings')

module.exports = class AuthenticationService {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.userDAO = new UserDAO(database, logger)
        this.settingsDAO = new SettingsDAO(database, logger)
    }

    /**
     * Returns a promise that will resolve with the completed hash.
     */
    hashPassword(password) {
        return bcrypt.hashSync(password, 10);
    }

    /**
     * Returns a promise that will resolve with `true` or `false` depending on
     * whether they match.
     */
    checkPassword(password, hash) {
        return bcrypt.compareSync(password, hash);
    }

    async loginUser(id, request) {
        const users = await this.userDAO.selectUsers('WHERE users.id=$1', [id])
        if ( ! users ) {
            throw new ServiceError('no-user', 'Failed to get full record for authenticated user!')
        } 

        const settings = await this.settingsDAO.selectSettings('WHERE user_settings.user_id = $1', [ id ])
        if ( settings.length == 0 ) {
            throw new ServiceError('no-settings', 'Failed to retrieve settings for authenticated user.')
        }

        request.session.user = users[0]
        return {
            user: request.session.user,
            settings: settings[0] 
        }
    }

    async authenticateUser(credentials) {
        /*************************************************************
         * To authenticate the user we need to check the following things:
         *
         * 1. Their email is attached to a user record in the database.
         * 2. Their email is only attached to one user record in the database.
         * 3. They have a password set. (If they don't, they authenticated with
         * ORCID iD and cannot authenticate with this endpoint.)
         * 4. The submitted credentials include a password.
         * 5. The passwords match.
         * 
         * **********************************************************/
        const results = await this.database.query(
            'select id, password from users where email = $1',
            [ credentials.email ]
        )

        // 1. Their email is attached to a user record in the database.
        if ( results.rows.length <= 0) {
            throw new ServiceError('no-user', `No users exist with email ${credentials.email}.`)
        }

        // 2. Their email is only attached to one user record in the database.
        if (results.rows.length > 1 ) {
            throw new ServiceError('multiple-users', `Multiple users found for email ${credentials.email}.`)
        }

        // 3. They have a password set. (If they don't, they authenticated with
        // ORCID iD and cannot authenticate with this endpoint.)
        if ( ! results.rows[0].password || results.rows[0].password.trim().length <= 0) {
            throw new ServiceError('no-user-password', `User(${credentials.email}) doesn't have a password set.`)
        }

        // 4. The submitted credentials include a password.
        if ( ! credentials.password || credentials.password.trim().length <= 0 ) {
            throw new ServiceError('no-credential-password', `User(${credentials.email}) attempted to login with no password.`)
        }

        // 5. The passwords match.
        const userMatch = results.rows[0]
        const passwords_match = this.checkPassword(credentials.password, userMatch.password)
        if (! passwords_match) {
            throw new ServiceError('authentication-failed', `Failed login for email ${credentials.email}.`)
        }

        
        return userMatch.id 
    }

}
