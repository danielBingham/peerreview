/******************************************************************************
 *      ResponseController
 *
 * Restful routes for manipulating responses.
 *
 ******************************************************************************/

const backend = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class ResponseController {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger

        this.responseDAO = new backend.ResponseDAO(core)
        this.paperDAO = new backend.PaperDAO(core)

        this.reputationGenerationService = new backend.ReputationGenerationService(core)
        this.reputationPermissionService = new backend.ReputationPermissionService(core)
    }

    // TODO Techdebt Need to merge this with getResponses and use the
    // meta/results format.
    async countResponses(request, response) {
        const counts = await this.responseDAO.countResponses()
        return response.status(200).json(counts)
    }

    /**
     * GET /paper/:paper_id/responses
     *
     * Return a JSON array of all responses in thethis.database.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.paper_id The database id of the paper we
     * want to get responses for.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getResponses(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Responses are fully public to read, so there are no restrictions on
         * calling this endpoint.
         *
         * ***********************************************************/

        const responses = await this.responseDAO.selectResponses('WHERE responses.paper_id=$1', [ request.params.paper_id ])

        if ( ! responses ) {
            return response.status(200).json([])
        } else {
            return response.status(200).json(responses)
        }
    }

    /**
     * POST /paper/:paper_id/responses
     *
     * Create a new response in the this.database from the provided JSON.
     */
    async postResponses(request, response) {
        const paperResponse = request.body
        const paperId = request.params.paper_id
        const userId = request.session.user.id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * To POST a response a user must be:
         *
         * 1. Logged in.
         * 2. Have 'referee' reputation on Paper(:paper_id).
         * 3. Not be an author of the Paper(:paper_id).
         * 4. Not have previously posted a response to Paper(:paper_id).
         *
         * Futher the response must:
         *
         * 5. repsonse.userId must match the session User.id
         * 6. response.paperId must match :paper_id
         * 7. Must include a single verison.
         * 8. version.content must be at least 1 word.
         * 9. version.content must be at least 125 words to include a vote.
         * 10. Included vote must be 1, 0, or -1.
         *
         * ***********************************************************/
        
        // 1. Logged in.
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', 'User must be logged in to post a response!')
        }

        // 5. repsonse.userId must match the session User.id
        if ( userId != paperResponse.userId ) {
            throw new ControllerError(403, 'not-authorized:user-mismatch',
                `User(${userId}) submitted a response for User(${paperResponse.userId}).`)
        }

        // 6. response.paperId must match :paper_id
        if ( paperId != paperResponse.paperId ) {
            throw new ControllerError(400, 'id-mismatch:paper',
                `Response submitted for Paper(${paperResponse.paperId}) on route for Paper(${paperId}).`)
        }

        // 7. Must include a single verison.
        if ( ! paperResponse.versions || paperResponse.versions.length != 1 ) {
            throw new ControllerError(400, 'no-version',
                `User(${request.session.user.id}) attempted to submit a response with no versions.`)
        }

        // 8. version.content must be at least 1 character.
        if ( paperResponse.versions[0].content.length < 1 ) {
            throw new ControllError(400, 'no-content',
                `User(${userId}) submitted a response on Paper(${paperId}) with no content.`)
        }

        // 9. version.content must be at least 125 words to include a vote.
        if ( paperResponse.vote != 0 && paperResponse.versions[0].content.split(/\s/).length < 125 ) {
            throw new ControllerError(400, 'too-short-to-vote',
                `User(${userId}) submitted a response on Paper(${paperId}) with a vote and not enough content.`)
        }

        // 10. Included vote must be 1, 0, or -1.
        if ( paperResponse.vote > 1 || paperResponse.vote < -1 ) {
            throw new ControllerError(400, 'invalid-vote',
                `User(${userId}) submitted an invalid vote on Paper(${paperId}).`)
        }
        

        // 2. Have 'referee' reputation on Paper(:paper_id).
        const canRespond = this.reputationPermissionService.canReferee(paperResponse.userId, paperResponse.paperId)
        if ( ! canRespond ) {
            throw new ControllerError(400, 'not-enough-reputation', 
                `User(${paperResponse.userId}) attempted to respond to Paper(${paperResponse.paperId}) with out enough reputation to do so!`)
        }

        // 3. Not be an author of the Paper(:paper_id).
        const authorResults = await this.database.query(`
            SELECT user_id FROM paper_authors WHERE paper_id = $1
        `, [ paperId ])

        if ( authorResults.rows.find((r) => r.user_id == userId) ) {
            throw new ControllerError(403, 'not-authorized:author',
                `User(${userId}) attempted to submit a response to their own Paper(${paperId}).`)
        }

        // 4. Not have previously posted a response to Paper(:paper_id).
        const responseExistsResults = await this.database.query(
            'SELECT id FROM responses WHERE user_id=$1 AND paper_id=$2',
            [ paperResponse.userId, paperResponse.paperId ]
        )

        if (responseExistsResults.rowCount > 0) {
            throw new ControllerError(400, 'response-exists', 
                `User[${request.session.user.id}] attempted to post a second response to paper[${paperResponse.paperId}].`)
        }

        /********************************************************
         * Input Validation Complete 
         *      Create the new Response 
         ********************************************************/

        await this.database.query('BEGIN')
        try {
            paperResponse.id = await this.responseDAO.insertResponse(paperResponse)
            for ( const version of paperResponse.versions ) {
                await this.responseDAO.insertResponseVersion(paperResponse, version)
            }
        } catch (error) {
            await this.database.query('ROLLBACK')
            throw error
        }
        await this.database.query('COMMIT')

        const returnResponses = await this.responseDAO.selectResponses('WHERE responses.id=$1', [paperResponse.id])

        if ( returnResponses.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `Failed to find Response(${paperResponse.id}) after insertion.`)
        }

        const returnResponse = returnResponses[0]

        await this.database.query('BEGIN')
        try {
            await this.reputationGenerationService.incrementReputationForPaper(returnResponse.paperId, returnResponse.vote)
        } catch (error) {
            await this.database.query(`ROLLBACK`)
            throw error
        }
        await this.database.query('COMMIT')

        await this.paperDAO.refreshPaperScore(returnResponse.paperId)

        return response.status(201).json(returnResponse)
    }

    /**
     * GET /response/:id
     *
     * Get details for a single response in thethis.database.
     */
    async getResponse(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Responses are fully public to read, so there are no restrictions on
         * calling this endpoint.
         *
         * ***********************************************************/
        const paperId = request.params.paper_id
        const id = request.params.id

        const returnResponses = await this.responseDAO.selectResponses('WHERE responses.id = $1', [ id ])

        if ( returnResponses.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Failed to find response[${id}].`)
        }

        const returnResponse = returnResponses[0]
        const user = request.session.user || null

        if ( returnResponse.status == 'in-progress' && ( ! user || user.id != returnResponse.userId ) ) {
            throw new ControllerError(
                404, 
                'not-found', 
                `Unauthorized attempt to retrieve in-progress response by ${ ( user ? user.id : 'unauthenticated user' ) }.`)
        }

        return response.status(200).json(returnResponse)
    }

    /**
     * PUT /response/:id
     *
     * Replace an existing response wholesale with the provided JSON.
     */
    async putResponse(request, response) {
        const paperResponse = request.body

        paperResponse.paperId = request.params.paper_id
        paperResponse.id = request.params.id

        const user = request.session.user || null

        const results = await this.database.query(`
                SELECT responses.user_id AS "userId", responses.status FROM responses WHERE responses.id = $1
            `, [ paperResponse.id ])

        // If we didn't find a response at this stage, it's because it doesn't exist.  
        if ( results.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Failed to find response ${paperResponse.id} in PUT attempt.`)
        }

        // Only the owner of the response may modify it and only the owner
        // of the response may know about their own in-progress responses.
        if ( ! user || user.id != results.rows[0].userId ) {
            const culprit = user ? user.id : 'unauthenticated user'
            if ( results.rows[0].status == 'in-progress') {
                throw new ControllerError(
                    404, 
                    'not-found', 
                    `Unauthorized attempt to PUT in-progress response ${paperResponse.id} by ${ culprit }.`)
            } else {
                throw new ControllerError(
                    403, 
                    'not-authorized', 
                    `Unauthorized attempt to PUT response ${paperResponse.id} by ${culprit}.`)
            }
        }

        await this.database.query(`BEGIN`)
        try {
            // We've checked the owner is allowed to do this - update the
            // response.
            await this.responseDAO.updateResponse(paperResponse)

            const deleteResults = await this.database.query(`
                    DELETE FROM response_versions WHERE responses.id = $1
                `, [ paperResponse.id ])

            if( paperResponse.versions && paperResponse.versions.length > 0 ) {
                for( const version of paperResponse.versions ) {
                    await this.responseDAO.insertVersion(paperResponse, version)
                }
            }
        } catch (error) {
            await this.database.query(`ROLLBACK`)
            throw error
        }
        await this.database.query(`COMMIT`)

        const returnResponses = await this.responseDAO.selectResponses('WHERE responses.id=$1', paperResponse.id)
        if ( returnResponses.length <= 0 ) {
            throw new ControllerError(500, 'server-error', `Failed to find response ${paperResponse.id} after updating!`)
        }
        return response.status(200).json(returnResponses[0])
    }

    /**
     * PATCH /response/:id
     *
     * Update an existing response given a partial set of responses in JSON.
     */
    async patchResponse(request, response) {
        const paperResponse = request.body
        paperResponse.id = request.params.id
        paperResponse.paperId = request.params.paper_id

        const user = request.session.user || null

        const results = await this.database.query(`
                SELECT responses.user_id AS "userId", responses.status FROM responses WHERE responses.id = $1
            `, [ paperResponse.id ])

        // If we didn't find a response at this stage, it's because it doesn't exist.  
        if ( results.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Failed to find response ${paperResponse.id} in PUT attempt.`)
        }

        // Only the owner of the response may modify it and only the owner
        // of the response may know about their own in-progress responses.
        if ( ! user || user.id != results.rows[0].userId ) {
            const culprit = user ? user.id : 'unauthenticated user'
            if ( results.rows[0].status == 'in-progress') {
                throw new ControllerError(
                    404, 
                    'not-found', 
                    `Unauthorized attempt to PUT in-progress response ${paperResponse.id} by ${ culprit }.`)
            } else {
                throw new ControllerError(
                    403, 
                    'not-authorized', 
                    `Unauthorized attempt to PUT response ${paperResponse.id} by ${culprit}.`)
            }
        }

        await this.responseDAO.updatePartialResponse(paperResponse)

        const returnResponses = await this.responseDAO.selectResponses('WHERE responses.id=$1', [paperResponse.id])
        if (returnResponses.length <= 0 ) {
            throw new ControllerError(500, 'server-error', `Failed to find response ${paperResponse.id} after updating from partial response!`)
        }
        return response.status(200).json(returnResponses[0])
    }

    /**
     * DELETE /response/:id
     *
     * Delete an existing response.
     */
    async deleteResponse(request, response) {
        const id = request.params.id
        const paperId = request.params.paper_id
        const user = request.session.user || null

        const results = await this.database.query(`
                SELECT responses.user_id AS "userId", responses.status FROM responses WHERE responses.id = $1
            `, [ id ])

        // If we didn't find a response at this stage, it's because it doesn't exist.  
        if ( results.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found', `Failed to find response ${id} in DELETE attempt.`)
        }

        // Only the owner of the response may modify it and only the owner
        // of the response may know about their own in-progress responses.
        if ( ! user || user.id != results.rows[0].userId ) {
            const culprit = user ? user.id : 'unauthenticated user'
            if ( results.rows[0].status == 'in-progress') {
                throw new ControllerError(
                    404, 
                    'not-found', 
                    `Unauthorized attempt to DELETE in-progress response ${id} by ${ culprit }.`)
            } else {
                throw new ControllerError(
                    403, 
                    'not-authorized', 
                    `Unauthorized attempt to DELETE response ${id} by ${culprit}.`)
            }
        }

        await this.responseDAO.deleteResponse(id)

        return response.status(200).json({responseId: id})
    }
} 
