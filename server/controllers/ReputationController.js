const ReputationPermissionService = require('../services/ReputationPermissionService')
const ReputationGenerationService = require('../services/ReputationGenerationService')
const ReputationDAO = require('../daos/ReputationDAO')

const ServiceError = require('../errors/ServiceError')
const ControllerError = require('../errors/ControllerError')


module.exports = class ReputationController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.reputationPermissionService = new ReputationPermissionService(database, logger)
        this.reputationGenerationService = new ReputationGenerationService(database, logger)
        this.reputationDAO = new ReputationDAO(database, logger)
    }

    /**
     * /reputation/thresholds
     *
     * Get the permissions reputation thresholds, defining the amount of
     * reputation needed to perform each task on the site.  The thresholds are
     * defined as multiples of the field's averageReputation.
     *
     * @param {Object} request  Standard express Request object.
     * @param {Object} response Standard express Resposne object.
     *
     * @return {voice}
     *
     * @throws {Error} Any errors are passed on to the error handler.
     */
    async getReputationThresholds(request, response) {
        const thresholds = this.reputationPermissionService.getThresholds()
        return response.status(200).json(thresholds)
    }

    /**
     * /user/:user_id/reputation/initialization
     *
     * Initialize reputation for the User identified by :user_id.
     *
     * @param {Object} request  Standard express Request object.
     * @param {Object} request.params.user_id   The database id of the user we
     * wish to initialize reputation for.
     * @param {Object} response Standard express Response object.
     * 
     * @return {void}
     *
     * @throws {ControllerError}  Any user error will be wrapped in a ControllerError.
     * @throws {Error} Most other errors will be passed on to the error handler.
     */
    async initializeReputation(request, response) {
        const userId = request.params.user_id

        // Make sure we have everything we need.
        if ( ! userId ) {
            throw new ControllerError(400, 'userId-is-required', `User attempted to initialize reputation with out a user_id.`)
        }

        // Only authenticated users may initialize reputation.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to initialize reputation for User(${userId}).`)
        }

        // Users may only initialize their own reputation.  We'll add admins
        // who can initialize other users reputation later.
        if ( request.session.user.id != userId ) {
            throw new ControllerError(403, 'not-authorized:wrong-user',
                `User(${request.session.user.id}) attempted to initialize reputation for User(${userId}).`)
        }

        try {
            await this.reputationGenerationService.initializeReputationForUser(userId)
        } catch (error) {
            if ( error instanceof ServiceError) {
                if (error.type == 'no-orcid') {
                    throw new ControllerError(400, 'no-orcid', 
                        `Cannot initialize reputation for User(${userId}) with out a connected ORCID iD.`)
                } else if ( error.type == 'request-failed' ) {
                    throw new ControllerError(500, 'server-error:api-connection', error.message)
                } else if ( error.type == 'no-author' ) {
                    throw new ControllerError(500, 'no-openalex-record', error.message)
                } else if ( error.type == 'multiple-authors' ) {
                    throw new ControllerError(500, 'multiple-openalex-record', error.message)
                } 

                throw error
            } else {
                throw error
            }
        }
        
    }

    /**
     * Local method to process the query string and construct SQL to be passed
     * on to the ReputationDAO's selectReputation and countReputation methods.
     *
     * @param {Object} query    The query object taken straight from expresses
     * standard Request object (`request.query`).
     *
     * @return {Object} An object defining the SQL `where` condition, as well
     * as paging details.  Of the structure:
     *
     * ```
     *  const result = {
     *      where: '',
     *      params: [],
     *      page: 1,
     *      pageSize: 20,
     *      emptyResult: false
     *  }
     * ```
     *
     */
    async buildQuery(query) {
        let count = 0

        // ==============================
        // Returned object with defaults.
        // ==============================
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

        if ( query.fieldIds ) {
            count += 1
            result.where += `${ count > 1 ? ' AND ' : '' } user_field_reputation.field_id = ANY($${count}::bigint[])`
            result.params.push(query.fieldIds)
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

        const userId = request.params.user_id
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
        const userId = request.params.user_id
        const fieldId = request.params.field_id

        const reputation = await this.reputationDAO.selectReputation('WHERE user_field_reputation.user_id = $1 AND user_field_reputation.field_id = $2', [ userId, fieldId])

        if ( reputation.length <= 0) {
            return response.status(404).json({ error: 'no-resource' })
        }

        return response.status(200).json(reputation[0])
    }


}
