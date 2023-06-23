const backend = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class AdminController {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.reputationService = new backend.ReputationGenerationService(core)
    }

   async initializeReputationFromOrcid(request, response) {
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Unauthenticated user attempted to initialize reputation from orcid id.`)
        }

       if ( request.session.user.permissions != 'admin' && request.session.user.permissions != 'superadmin') {
           throw new ControllerError(403, 'not-authorized',
               `Unauthorized User (${request.session.user.id}) attempted to initialize reputation from orcid id.`)
       }

        await this.reputationService.initializeReputationForUserWithOrcidId(request.params.id, request.params.orcidId)
        return response.status(200).send()
   }

    async initializeReputationFromOpenAlex(request, response) {
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Unauthenticated user attempted to initialize reputation from open alex id`)
        }

        if ( request.session.user.permissions != 'admin' && request.session.user.permissions != 'superadmin') {
            throw new ControllerError(403, 'not-authorized',
                `Unauthorized User (${request.session.user.id}) attempted to initialize reputation from open alex id.`)
        }

        await this.reputationService.initializeReputationForUserWithOpenAlexId(request.params.id, request.params.openAlexId)
            return response.status(200).send()

    }

    async recalculateReputation(request, response) {
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Unauthenticated user attempted to recalculate reputation.`)
        }

       if ( request.session.user.permissions != 'admin' && request.session.user.permissions != 'superadmin') {
           throw new ControllerError(403, 'not-authorized',
               `Unauthorized User (${request.session.user.id}) attempted to recalculate reputation`)
       }

        await this.reputationService.recalculateReputationForUser(request.params.id)
        return response.status(200).send()
    }


}
