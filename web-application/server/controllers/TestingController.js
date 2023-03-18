const backend = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class TestingController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.auth = new backend.AuthenticationService(database, logger)
        this.reputationGenerationService = new backend.ReputationGenerationService(database, logger)
        this.userDAO = new backend.UserDAO(database)
        this.settingsDAO = new backend.SettingsDAO(database, logger)
    }

    async postOrcid(request, response) {
        const orcidId = request.body.orcidId
        const orcidResults = await this.database.query(`
                SELECT users.id FROM users WHERE users.orcid_id = $1
            `, [ orcidId])

        // If we have a user logged in, then this is a request to connect their
        // accounts. 
        //
        //  If we have orcidResults, then that means this ORCID iD is already
        //  linked to an account - either this one or another one. 
        if ( request.session.user &&  orcidResults.rows.length <= 0 ) {
            const responseBody = await this.auth.connectOrcid(request, orcidId)
            console.log('Finished connecting orcid: ')
            console.log(responseBody)
            return response.status(200).json(responseBody)
        } else if ( request.session.user ) {
            throw new ControllerError(400, 'already-linked',
                `User(${request.session.user.id}) attempting to link ORCID iD (${orcidId}) already connected to User(${orcidResults.rows[0].id}).`)
        }
    }

    async getOrcidReset(request, response) {
        const user = request.session.user
        console.log('Resetting user: ')
        console.log(user)
        if ( ! user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Attempt to reset orcid with out an authenticated user.`)
        }

        const initialFieldReputationResults = await this.database.query(`
            DELETE FROM user_initial_field_reputation WHERE user_id = $1
        `, [ user.id ])

        const initialWorksReputationResults = await this.database.query(`
            DELETE FROM user_initial_works_reputation WHERE user_id = $1
        `, [ user.id ])

        const orcidResults = await this.database.query(`
            UPDATE users SET orcid_id = null WHERE id = $1
        `, [ user.id ])

        const fieldReputation = await this.database.query(`
            DELETE FROM user_field_reputation WHERE user_id = $1
        `, [ user.id ])

        await this.reputationGenerationService.recalculateReputation(user.id)       

        const users = await this.userDAO.selectUsers('WHERE users.id=$1', [user.id])
        if ( ! users ) {
            throw new ServiceError('no-user', 'Failed to get full record for authenticated user!')
        } 

        const settings = await this.settingsDAO.selectSettings('WHERE user_settings.user_id = $1', [ user.id ])

        request.session.user = users[0]

        const responseBody = {
            user: request.session.user,
            settings: settings[0]
        }

        console.log('Response body: ')
        console.log(responseBody)

        return response.status(200).json(responseBody)
    }

}
