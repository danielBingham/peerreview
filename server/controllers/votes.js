/******************************************************************************
 *    VoteController 
 *
 * Restful routes for manipulating Votes.
 *
 ******************************************************************************/


/**
 *
 */
module.exports = class VoteController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
    }


    /**
     * GET /paper/:paper_id/votes
     *
     * Return a JSON array of all votes for this paper in the database.
     */
    async getVotes(request, response) {
        try {
            const paper_id = request.params.paper_id
            const results = this.database.query('SELECT paper_id as "paperId", user_id as "userId", score from paper_votes where paper_id=$1', [ paper_id ])

            const votes = results.rows
            return response.status(200).json(votes)
        } catch (error) {
            this.logger.error(error)
            response.status(500).json({ error: 'unknown' })
            return
        }
    }

    /**
     * POST /paper/:paper_id/votes
     *
     * Create a new vote in the database from the provided JSON.
     */
    async postVotes(request, response) {
        const vote = request.body

        try {
            const results = await this.database.query(`
                INSERT INTO paper_votes (paper_id, user_id, score) 
                    VALUES ($1, $2, $3) 
                RETURNING paper_id as "paperId", user_id as "userId", score
                `, 
                [ request.params.paper_id, vote.userId, vote.score]
            )
            if ( results.rows.length == 0 ) {
                this.logger.error('Failed to insert a vote.')
                return response.status(500).json({error: 'unknown'})
            }

            const returnVote = results.rows[0]
            console.log('returnVote: ')
            console.log(returnVote)
            return response.status(201).json(returnVote)
        } catch (error) {
            this.logger.error(error)
            return response.status(500).json({error: 'unknown'})
        }
    }

    /**
     * GET /paper/:paper_id/user/:user_id/vote
     *
     * Get details for a single vote in the database.
     */
    async getVote(request, response) {
        try {
            const paper_id = request.params.paper_id
            const user_id = request.params.user_id

            const results = this.database.query('SELECT paper_id as "paperId", user_id as "userId", score from paper_votes where paper_id=$1 and user_id=$2', [ paper_id, user_id ])

            if ( ! vote ) {
                return response.status(404).json({})
            }

            return response.status(200).json(vote)
        } catch (error) {
            this.logger.error(error)
            return response.status(500).json({ error: 'unknown' })
        }
    }

    /**
     * PUT /paper/:paper_id/user/:user_id/vote
     *
     * Replace an existing vote wholesale with the provided JSON.
     */
    async putVote(request, response) {
        try {
            const vote = request.body

            // Update the vote.
            const results = await this.database.query(`
                UPDATE paper_votes 
                    SET score = $1 
                WHERE paper_id = $2 and user_id=$3
                RETURNING paper_id as "paperId", user_id as "userId", score
                `,
                [ vote.score, request.params.paper_id, request.params.user_id ]
            )

            if (results.rowCount == 0 && results.rows.length == 0) {
                return response.status(404).json({error: 'no-resource'})
            }

            response.status(200).json(results.rows)
        } catch (error) {
            this.logger.error(error)
            response.status(500).json({error: 'unknown'})
        }
    }


    /**
     * DELETE /paper/:paper_id/user/:user_id/vote
     *
     * Delete an existing vote.
     */
    async deleteVote(request, response) {
        try {
            const results = await this.database.query(
                'delete from paper_votes where paper_id = $1 and user_id = $2',
                [ request.params.paper_id, request.params.user_id ]
            )

            if ( results.rowCount == 0) {
                return response.status(404).json({error: 'no-resource'})
            }

            return response.status(200).json(null)
        } catch (error) {
            this.logger.error(error)
            return response.status(500).json({error: 'unknown'})
        }
    }
} 
