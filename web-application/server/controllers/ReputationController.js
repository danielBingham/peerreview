/******************************************************************************
 *
 *
 *
 * ***************************************************************************/

const BullQueue = require('bull')

const backend = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class ReputationController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.reputationPermissionService = new backend.ReputationPermissionService(database, logger)
        this.reputationGenerationService = new backend.ReputationGenerationService(database, logger)
        this.reputationDAO = new backend.ReputationDAO(database, logger)
        this.userDAO = new backend.UserDAO(database)
        this.settingsDAO = new backend.SettingsDAO(database, logger)

        this.processQueue = new BullQueue('reputation', { redis: config.redis })
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
     * @return {Promise} Resolves to void.
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
     * @return {Promise} Resolves to void.
     *
     * @throws {ControllerError}  Any user error will be wrapped in a ControllerError.
     * @throws {Error} Most other errors will be passed on to the error handler.
     */
    async initializeReputation(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User must be initializing their own reputation.
         *
         * Validation:
         *
         * 1. :user_id must be set.
         * 2. User must have an ORCID iD attached to their record.
         * 
         * ********************************************************************/
        const userId = request.params.user_id

        // Validation: 1. :user_id must be set.
        if ( ! userId ) {
            throw new ControllerError(400, 'userId-is-required', `User attempted to initialize reputation with out a user_id.`)
        }

        // Permissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempted to initialize reputation for User(${userId}).`)
        }

        // Permissions: 2. User must be initializing their own reputation.
        // Users may only initialize their own reputation.  We'll add admins
        // who can initialize other users reputation later.
        if ( request.session.user.id != userId ) {
            throw new ControllerError(403, 'not-authorized:wrong-user',
                `User(${request.session.user.id}) attempted to initialize reputation for User(${userId}).`)
        }

        try {
            const job = await this.processQueue.add('initialize-reputation', { userId: userId })
            return response.status(200).json({ job: { id: job.id } })


            /*await this.reputationGenerationService.initializeReputationForUser(userId)

            const users = await this.userDAO.selectUsers('WHERE users.id=$1', [userId])
            if ( ! users ) {
                throw new ServiceError('no-user', 'Failed to get full record for authenticated user!')
            } 

            const settings = await this.settingsDAO.selectSettings(
                'WHERE user_settings.user_id = $1', 
                [ userId ]
            )

            request.session.user = users[0]

            const responseBody = {
                user: request.session.user,
                settings: settings[0]
            }

            console.log('Response body: ')
            console.log(responseBody) 

            return response.status(200).json({}) */
        } catch (error) {
            if ( error instanceof backend.ServiceError) {
                // Validation: 2. User must have an ORCID iD attached to their record.
                // We checked this in ReputationGenerationService::initializeReputationForUser()
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
     * Helper method.
     *
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


    /**
     * GET /user/:user_id/reputations
     *
     * Get the list of reputation by field for a user.  Responds with the
     * meta/results format.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.user_id  The database id of the user who
     * reputation we wish to get.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getReputations(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  
         * 
         * ********************************************************************/
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

    /**
     * GET /user/:user_id/reputation/:field_id
     *
     * Responds with JSON reputation resource for the requested user_id and
     * field_id, or 404.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.user_id  The database id of the user who's
     * reputation we wish to load.
     * @param {int} request.params.field_id The database id of the field that
     * we wish to get User(:user_id)'s reputation in.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getReputation(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  
         * 
         * ********************************************************************/
        const userId = request.params.user_id
        const fieldId = request.params.field_id

        const reputation = await this.reputationDAO.selectReputation('WHERE user_field_reputation.user_id = $1 AND user_field_reputation.field_id = $2', [ userId, fieldId])

        if ( reputation.length <= 0) {
            return response.status(404).json({ error: 'no-resource' })
        }

        return response.status(200).json(reputation[0])
    }


}
