/******************************************************************************
 *      ResponseController
 *
 * Restful routes for manipulating responses.
 *
 ******************************************************************************/
const ResponseDAO = require('../daos/responses')
const ReputationPermissionService = require('../services/ReputationPermissionService')

const ControllerError = require('../errors/ControllerError')
const DAOError = require('../errors/DAOError')


module.exports = class ResponseController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
        this.responseDAO = new ResponseDAO(database, logger)
        this.reputationPermissionService = new ReputationPermissionService(database, logger)
    }

    async countResponses(request, response) {
        const counts = await this.responseDAO.countResponses()
        return response.status(200).json(counts)
    }

    /**
     * GET /paper/:paper_id/responses
     *
     * Return a JSON array of all responses in thethis.database.
     */
    async getResponses(request, response) {
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
        if ( ! request.session || ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', 'User must be logged in to post a response!')
        }

        const paperResponse = request.body
        paperResponse.paperId = request.params.paper_id
        paperResponse.userId = request.session.user.id

        // Ensure they have enough reputation to respond.
        const canRespond = this.reputationPermissionService.canReferee(paperResponse.userId, paperResponse.paperId)
        if ( ! canRespond ) {
            throw new ControllerError(400, 'not-enough-reputation', `User(${paperResponse.userId}) attempted to respond to Paper(${paperResponse.paperId}) with out enough reputation to do so!`)
        }

        // If a response already exists with that name, send a 400 error.
        //
        const responseExistsResults = await this.database.query(
            'SELECT id FROM responses WHERE user_id=$1 AND paper_id=$2',
            [ paperResponse.userId, paperResponse.paperId ]
        )

        if (responseExistsResults.rowCount > 0) {
            throw new ControllerError(400, 'response-exists', `User[${request.session.user.id}] attempted to post a second response to paper[${paperResponse.paperId}].`)
        }

        paperResponse.id = await this.responseDAO.insertResponse(paperResponse)
        for ( const version of paperResponse.versions ) {
            await this.responseDAO.insertResponseVersion(paperResponse, version)
        }

        const returnResponse = await this.responseDAO.selectResponses('WHERE responses.id=$1', [paperResponse.id])
        return response.status(201).json(returnResponse)
    }

    /**
     * GET /response/:id
     *
     * Get details for a single response in thethis.database.
     */
    async getResponse(request, response) {
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
