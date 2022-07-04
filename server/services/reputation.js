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

    async resetUserReputation(userId) {
        const fieldResults = await this.database.query(`
            UPDATE user_field_reputation SET reputation = 0 WHERE user_id = $1
        `, [ userId ])

        const paperResults = await this.database.query(`
            UPDATE user_paper_reputation SET reputation = 0 WHERE user_id = $1
        `, [ userId ])
    }

    /**
     * Assumptions: We're recalculating the reputation for that user.  The
     * `user_reputation` field has been wiped, meaning the reputation from this
     * paper is not accounted for in it.
     */
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

    async recalculateUserReputationForPaper(userId, paperId) {
        const scoreResults = await this.database.query(`
            SELECT SUM(score) as "totalScore" from paper_votes where paper_id = $1
        `, [ paperId ])

        if ( scoreResults.rows.length == 0) {
            return
        }
        
        const reputation = scoreResults.rows[0].totalScore * 10

        const paperUpdateResults = await this.database.query(`
            UPDATE user_paper_reputation SET reputation = $1 WHERE user_id = $2 AND paper_id = $3
        `, [ reputation, userId, paperId ])

        await this.recalculateUserReputationForPaperFields(userId, paperId, reputation)
    }

    async recalculateReputationForUser(userId) {
        const userResults = await this.database.query(`
            UPDATE users 
                SET reputation = initial_reputation + paper_reputation.total
            FROM ( SELECT SUM(reputation) as total FROM user_paper_reputation WHERE user_id = $1) AS paper_reputation
            WHERE id = $1
        `, [ userId ] )

        if ( userResults.rowCount == 0) {
            throw new Error(`Attempt to recalculate reputation for user ${userId} failed!`)
        }

    }

    async recalculateReputation(userId) {
        await this.resetUserReputation(userId) 

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

        await this.recalculateRpeutationForUser(userId)

    }

    async incrementUserReputationForPaperFields(userId, paperId, score) {
        const reputation = score * 10

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

        await this.incrementUserReputationForPaperFields(userId, paperId, score)    

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

}
