const ReputationPermissionService = require('../services/ReputationPermissionService')
const ReputationDAO = require('../daos/ReputationDAO')


module.exports = class ReputationController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.reputationPermissionService = new ReputationPermissionService(database, logger)
        this.reputationDAO = new ReputationDAO(database, logger)
    }

    async getReputationThresholds(request, response) {
        const thresholds = this.reputationPermissionService.getThresholds()
        return response.status(200).json(thresholds)
    }

    async buildQuery(query) {
        let count = 0
        const result = {
            where: '',
            params: [],
            page: 1,
            pageSize: 20,
            emptyResult: false
        }

        result.where = 'WHERE'

        if ( query.paperId ) {
            const paperResults = await this.database.query(`
                SELECT field_id FROM paper_fields WHERE paper_id = $1
            `, [ query.paperId ])

            if ( paperResults.rows.length <= 0 ) {
                result.emptyResult = true
                return result
            }
            
            count += 1
            result.where += `${ count > 1 ? ' AND ' : '' } user_field_reputation.field_id = ANY($${count}::bigint[])`
            result.params.push(paperResults.rows.map((r) => r.field_id))
        }

        if ( query.page ) {
            result.page = query.page 
        }  else {
            result.page = 1
        }

        if ( query.pageSize ) {
            result.pageSize = query.pageSize
        }

        return result
    }

    async getReputations(request, response) {
        let { where, params, page, pageSize } = await this.buildQuery(request.query) 

        const userId = request.params.id
        where += `${ params.length+1 > 1 ? ' AND ' : ''} user_field_reputation.user_id = $${params.length+1}`
        params.push(userId)

        const meta = await this.reputationDAO.countReputation(where, params, pageSize)
        const reputations = await this.reputationDAO.selectReputation(where, params, page, pageSize)
        
        return response.status(200).json({
            meta: meta,
            results: reputations
        })
    }

    async getReputation(request, response) {
        const userId = request.params.id
        const fieldId = request.params.field_id

        const reputation = await this.reputationDAO.selectReputation('WHERE user_field_reputation.user_id = $1 AND user_field_reputation.field_id = $2', [ userId, fieldId])

        if ( reputation.length <= 0) {
            return response.status(404).json({ error: 'no-resource' })
        }

        return response.status(200).json(reputation[0])
    }


}
