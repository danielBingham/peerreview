/******************************************************************************
 *    VoteController 
 *
 * Restful routes for manipulating Votes.
 *
 ******************************************************************************/
const ReputationGenerationService = require('../services/ReputationGenerationService')
const ReputationPermissionService = require('../services/ReputationPermissionService')

const ControllerError = require('../errors/ControllerError')

/**
 *
 */
module.exports = class VoteController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
        this.reputationService = new ReputationGenerationService(database, logger)
        this.reputationPermissionService = new ReputationPermissionService(database, logger)
    }


    /**
     * GET /paper/:paper_id/votes
     *
     * Return a JSON array of all votes for this paper in the database.
     */
    async getVotes(request, response) {
        const paper_id = request.params.paper_id
        const results = await this.database.query('SELECT paper_id as "paperId", user_id as "userId", score from paper_votes where paper_id=$1', [ paper_id ])

        const votes = results.rows
        return response.status(200).json(votes)
    }

    /**
     * POST /paper/:paper_id/votes
     *
     * Create a new vote in the database from the provided JSON.
     */
    async postVotes(request, response) {
        // Only an authenticated user can vote.
        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `An attempt to vote by an un-authenticated user.`)
        }

        // Ensure the user has enough reputation to be able to vote on this
        // paper.
        const canVote = this.reputationPermissionService.canReferee(request.session.user.id, request.params.paper_id)
        if ( ! canVote ) {
            throw new ControllerError(403, 'not-enough-reputation', `User(${request.session.user.id}) attempted to vote on paper(${request.params.paper_id}) with out enough reputation.`)
        }

        const vote = request.body

        // Ensure that the user is casting their own vote and not someone
        // else's.
        if ( vote.userId != request.session.user.id ) {
            throw new ControllerError(400, 'user-mismatch', `User(${request.session.user.id}) attempted to post a vote for different User(${vote.userId}).`)
        }

        const results = await this.database.query(`
                INSERT INTO paper_votes (paper_id, user_id, score, created_date, updated_date) 
                    VALUES ($1, $2, $3, now(), now()) 
                RETURNING paper_id as "paperId", user_id as "userId", score
                `, 
            [ request.params.paper_id, vote.userId, vote.score]
        )

        if ( results.rows.length == 0 ) {
            throw new ControllerError(500, 'server-error', `Failed to insert a vote for user(${vote.userId}) and paper(${request.params.paper_id}).`)
        }


        const returnVote = results.rows[0]

        await this.reputationService.incrementReputationForPaper(returnVote.paperId, returnVote.score)

        return response.status(201).json(returnVote)
    }

    /**
     * GET /paper/:paper_id/user/:user_id/vote
     *
     * Get details for a single vote in the database.
     */
    async getVote(request, response) {
        const paper_id = request.params.paper_id
        const user_id = request.params.user_id

        const results = await this.database.query('SELECT paper_id as "paperId", user_id as "userId", score from paper_votes where paper_id=$1 and user_id=$2', [ paper_id, user_id ])

        if ( ! vote ) {
            return response.status(404).json({})
        }

        return response.status(200).json(vote)
    }

    /**
     * PUT /paper/:paper_id/user/:user_id/vote
     *
     * Replace an existing vote wholesale with the provided JSON.
     */
    async putVote(request, response) {
        // Only an authenticated user can change a vote.
        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `An attempt to vote by an un-authenticated user.`)
        }

        // Check to ensure the user has enough reputation to change this vote.
        const canVote = this.reputationPermissionService.canReferee(request.session.user.id, request.params.paper_id)
        if ( ! canVote ) {
            throw new ControllerError(403, 'not-enough-reputation', `User(${request.session.user.id}) attempted to vote on paper(${request.params.paper_id}) with out enough reputation.`)
        }

        // Ensure that the user changing the vote is the same one logged in.
        if ( request.params.user_id != request.session.user.id) {
            throw new ControllerError(400, 'user-mismatch', `User(${request.session.user.id}) attempted to post a vote for different User(${vote.userId}).`)
        }

        const vote = request.body

        // Update the vote.
        const results = await this.database.query(`
                UPDATE paper_votes 
                    SET score = $1, updated_date = now() 
                WHERE paper_id = $2 and user_id=$3
                RETURNING paper_id as "paperId", user_id as "userId", score
                `,
            [ vote.score, request.params.paper_id, request.params.user_id ]
        )

        if (results.rowCount == 0 && results.rows.length == 0) {
            return response.status(404).json({error: 'no-resource'})
        }

        response.status(200).json(results.rows)
    }


    /**
     * DELETE /paper/:paper_id/user/:user_id/vote
     *
     * Delete an existing vote.
     */
    async deleteVote(request, response) {
        // Only an authenticated user can change a vote.
        if ( ! request.session.user ) {
            throw new ControllerError(403, 'not-authorized', `An attempt to vote by an un-authenticated user.`)
        }

        // Check to ensure the user has enough reputation to change this vote.
        const canVote = this.reputationPermissionService.canReferee(request.session.user.id, request.params.paper_id)
        if ( ! canVote ) {
            throw new ControllerError(403, 'not-enough-reputation', `User(${request.session.user.id}) attempted to vote on paper(${request.params.paper_id}) with out enough reputation.`)
        }

        // Ensure that the user changing the vote is the same one logged in.
        if ( request.params.user_id != request.session.user.id) {
            throw new ControllerError(400, 'user-mismatch', `User(${request.session.user.id}) attempted to post a vote for different User(${vote.userId}).`)
        }

        const results = await this.database.query(
            'delete from paper_votes where paper_id = $1 and user_id = $2',
            [ request.params.paper_id, request.params.user_id ]
        )

        if ( results.rowCount == 0) {
            return response.status(404).json({error: 'no-resource'})
        }

        return response.status(200).json(null)
    }
} 
