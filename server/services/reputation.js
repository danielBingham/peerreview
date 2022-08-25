/**
 * Reputation Service
 *
 * Methods to help calculate and manage reputation.
 */

const FieldDAO = require('../daos/field')

module.exports = class ReputationService {

    constructor(database, logger) {
        this.database = database
        this.logger = logger

        this.fieldDAO = new FieldDAO(database, logger)
    }


    /**
     * Completely recalculate the user's reputation.
     *
     * @param {int} userId  The id of the user we want to recalculate
     * reputation for.
     */
    async recalculateReputation(userId) {
        const paperResults = await this.database.query(`
            SELECT papers.id as paper_id 
                FROM papers 
                LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id 
            WHERE paper_authors.user_id = $1
        `, [ userId ])

        if ( paperResults.rows.length <= 0 ) {
            return 
        }

        for ( const row of paperResults) {
            await this.recalculateUserReputationForPaper(userId, row.paper_id)
        }

        await this.recalculateUserReviewReputation(userId)

        await this.recalculateReputationForUser(userId)
    }

    /**
     * Completely Recalculate a user's reputation for a single paper.  
     * 
     * @param {int} userId  The id of the user who's reputation we're calculating.
     * @param {int} paperId The id of the paper we're calculating reputation gained from.
     */
    async recalculateUserReputationForPaper(userId, paperId) {
        // Reset the tables first.
        const fieldResults = await this.database.query(`
            DELETE FROM user_field_reputation WHERE user_id = $1
        `, [ userId ])

        const paperResults = await this.database.query(`
            DELETE FROM user_paper_reputation WHERE user_id = $1
        `, [ userId ])


        const scoreResults = await this.database.query(`
            SELECT SUM(score) as "totalScore" from paper_votes where paper_id = $1
        `, [ paperId ])

        if ( scoreResults.rows.length == 0) {
            return
        }

        const reputation = scoreResults.rows[0].totalScore * 10

        const paperInsertResults = await this.database.query(`
            INSERT INTO user_paper_reputation ( paper_id, user_id, reputation) VALUES ( $1, $2, $3) 
        `, [ paperId, userId, reputation ])

        if ( paperInsertResults.rowCount == 0) {
            throw new Error(`Failed to update user_paper_reputation for paper ${paperId}.`)
        }

        await this.recalculateUserReputationForPaperFields(userId, paperId, reputation)
    }


    /**
     * Recalculate a User's Reputation recieved from each field.  This table
     * doesn't play into the users total reputation count, rather it allows us
     * to quickly access how much reputation a user has earned in each
     * field.  
     *
     * @param {int} userId  The id of the user who's reputation we're calculating.
     * @param {int} paperId The id of the paper we're assessing reputation for.
     * @param {int} reputation  The total reputation the user gained from that paper.
     **/
    async recalculateUserReputationForPaperFields(userId, paperId, reputation) {
        const fieldResults = await this.database.query(`
            SELECT field_id from paper_fields where paper_id = $1
        `, [ paperId ])

        if ( fieldResults.rows.length == 0 ) {
            return 
        }
        const rootIds = fieldResults.rows.map((r) => r.field_id)

        const fieldIds = await this.fieldDAO.selectFieldParents(rootIds)
        const uniqueFieldIds = [ ...new Set(fieldIds) ]


        const existingFieldResults = await this.database.query(`
            SELECT field_id FROM user_field_reputation WHERE user_id = $1
        `, [ userId ])

        for ( const fieldId of uniqueFieldIds ) {
            if ( existingFieldResults.rows.length == 0 || ! existingFieldResults.rows.find((r) => r.field_id == fieldId)) {
                const insertResults = await this.database.query(`
                    INSERT INTO user_field_reputation (field_id, user_id, reputation) VALUES ($1, $2, $3)
                `, [ fieldId, userId, 0])

                if ( insertResults.rowCount == 0 ) {
                    throw new Error(`Something went wrong in an attempt to insert reputation for user: ${userId} and paper: ${paperId}.`)
                }
            }
        }

        const updateResults = await this.database.query(`
            UPDATE user_field_reputation SET reputation = reputation + $1 WHERE user_id = $2 AND field_id = ANY($3::int[])
        `, [ reputation, userId, uniqueFieldIds ])

        if ( updateResults.rowCount == 0 ) {
            throw new Error('No reputation rows updated.')
        }
    }


    /**
     * Recalculate the reputation a user has gained from reviews on papers.
     *
     * @param {int} userId  The id of the user for which we'd like to calculate review reputation.
     */
    async recalculateUserReviewReputation(userId) {
        // Reset the user_review_reputation table first.  That way we don't
        // have to worry about inserting vs updating.
        const reviewDeleteResults = await this.database.qeury(`
            DELETE FROM user_review_reputation WHERE user_id = $1
        `, [ userId ])

        // Now get a list of papers and a count versions that earned
        // reputation.
        const reviewResults = await this.database.query(`
            SELECT paper_id as paperId, COUNT(DISTINCT(version)) FROM reviews WHERE reviews.user_id = $1 AND reviews.status = 'accepted' GROUP BY paper_id
        `, [ userId ])

        // Walk that list and insert rows into the user_review_reputation table
        // to account for the reputation gained.
        if ( reviewResults.rows.length > 0) {
            for ( const row of reviewResults.rows ) {
                const updateResults = await this.database.query(`
                    INSERT INTO user_review_reputation (user_id, paper_id, reputation) VALUES ($1, $2, $3)
                `, [ userId, row.paperId, row.count * 25 ])

                if ( updateResults.rowCount == 0 ) {
                    throw new Error(`Failed to insert review reputation for user ${userId} and paper ${row.paperId}!`)
                }
            }
        }
    }

    /**
     *
     */
    async recalculateReputationForUser(userId) {
        const paperResults = await this.database.query(`
            SELECT SUM(reputation) as reputation FROM user_paper_reputation WHERE user_id = $1
        `, [ userId ])
    
        if ( paperResults.rows.length !== 1 ) {
            throw new Error('Paper reputation query returned invalid results!')
        }
        const paperReputation = ( paperResults.rows[0].reputation ? paperResults.rows[0].reputation : 0 )


        const reviewResults = await this.database.query(`
            SELECT SUM(reputation) as reputation FROM user_review_reputation WHERE user_id = $1
        `, [ userId ])

        if ( reviewResults.rows.length !== 1) {
            throw new Error('Review reputation query returned invalid results!')
        }
        const reviewReputation = ( reviewResults.rows[0].reputation ? reviewResults.rows[0].reputation: 0 ) 

        const userResults = await this.database.query(`
            UPDATE users 
                 SET reputation = initial_reputation + $1 + $2 
            WHERE id = $3
        `, [ paperReputation, reviewReputation, userId ] )

        if ( userResults.rowCount == 0) {
            throw new Error(`Attempt to recalculate reputation for user ${userId} failed!`)
        }
    }


    async incrementUserReputationForPaperFields(userId, paperId, reputation) {

        const fieldResults = await this.database.query(`
            SELECT field_id from paper_fields where paper_id = $1
        `, [ paperId ])

        if ( fieldResults.rows.length == 0 ) {
            return 
        }
        const rootIds = fieldResults.rows.map((r) => r.field_id)

        const fieldIds = await this.fieldDAO.selectFieldParents(rootIds)
        const set = new Set(fieldIds)
        const uniqueFieldIds = [ ...set ]

        const existingFieldResults = await this.database.query(`
            SELECT field_id FROM user_field_reputation WHERE user_id = $1
        `, [ userId ])

        for ( const fieldId of uniqueFieldIds ) {
            if ( existingFieldResults.rows.length == 0 || ! existingFieldResults.rows.find((r) => r.field_id == fieldId)) {
                const insertResults = await this.database.query(`
                    INSERT INTO user_field_reputation (field_id, user_id, reputation) VALUES ($1, $2, $3)
                `, [ fieldId, userId, reputation])

                if ( insertResults.rowCount == 0 ) {
                    throw new Error(`Something went wrong in an attempt to insert reputation for user ${userId} and paper ${paperId}.`)
                }
            } else {
                const updateResults = await this.database.query(`
                    UPDATE user_field_reputation SET reputation = reputation + $1 WHERE user_id = $2 AND field_id = $3 
                `, [ reputation, userId, fieldId])

                if ( updateResults.rowCount == 0 ) {
                    throw new Error(`Something went wrong in an attempt to update reputation for user ${userId} and paper ${paperId}.`)
                }
            }
        }
    }

    async incrementUserReputationForPaper(userId, paperId, score) {
        const reputation = score*10

        const paperResults = await this.database.query(`
            INSERT INTO user_paper_reputation ( reputation, user_id, paper_id ) VALUES ( $1, $2, $3 )
                ON CONFLICT ( paper_id, user_id ) DO 
            UPDATE SET reputation = user_paper_reputation.reputation + $1
        `, [ reputation, userId, paperId ])

        if ( paperResults.rowCount == 0) {
            throw new Error(`Upsert failed to modify rows for paper: ${paperId} and user: ${userId}.`)
        }

        await this.incrementUserReputationForPaperFields(userId, paperId, reputation)    

        await this.recalculateReputationForUser(userId)
    }

    async incrementReputationForPaper(paperId, score) {
        const authorsResults = await this.database.query(`
            SELECT user_id from paper_authors WHERE paper_id = $1
        `, [ paperId ])

        if ( authorsResults.rows.length == 0) {
            throw new Error(`Something went wrong when fetching authors for paper ${paperId}.`)
        }

        for (const row of authorsResults.rows) {
            await this.incrementUserReputationForPaper(row.user_id, paperId, score)
        }
    }

    async incrementReputationForReview(review) {
        if ( review.status !== 'accepted') {
            return
        }

        const reviewResults = await this.database.query(`
                SELECT id FROM reviews WHERE paper_id = $1 AND version = $2 AND user_id = $3 AND status='accepted'
             `, [ review.paperId, review.version, review.userId ])

        // You're only allowed to gain reputation from a single review on each
        // versions, so if there's one that already exists, we assume you've
        // gained reputation from it and bail.
        if ( reviewResults.rows.length !== 1 ) {
            return
        }

        const reviewReputationResults = await this.database.query(`
                INSERT INTO user_review_reputation (user_id, paper_id, reputation)
                    VALUES ($1, $2, $3)
                ON CONFLICT (user_id, paper_id) DO UPDATE
                    SET reputation = user_review_reputation.reputation + $3
            `, [ review.userId, review.paperId, 25 ])

        if ( reviewReputationResults.rowCount == 0) {
            throw new Error(`Failed to insert or update review reputation for review ${review.id}.`)
        }
        await this.incrementUserReputationForPaperFields(review.userId, review.paperId, 25)

        await this.recalculateReputationForUser(review.userId)
    }

}
