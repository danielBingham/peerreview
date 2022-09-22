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

}
