const ReputationPermissionService = require('../services/ReputationPermissionService')


module.exports = class ReputationController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.reputationPermissionService = new ReputationPermissionService(database, logger)
    }

    async getReputationThresholds(request, response) {
        const thresholds = this.reputationPermissionService.getThresholds()
        return response.status(200).json(thresholds)
    }



}
