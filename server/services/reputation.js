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

    async recalculateReputationForPaperFields(user, paper) {
        const fieldResults = await this.database.query(`
            SELECT field_id from paper_fields where paper_id = $1
        `, [ paper.id ])

        if ( fieldResults.rows.length == 0 ) {
            return 0
        }
        const rootIds = fieldResults.rows.map((r) => r.field_id)

        const fields = this.fieldDAO.selectFieldParents(rootIds)
        const uniqueFields = [ ...new Set(fields) ]

        for ( const field of uniqueFields ) {
            const results = await this.database.query(`
                SELECT user_id, field_id, reputation FROM user_reputation WHERE user_id = $1 AND field_id = $2
            `, [ user.id, field.id ])

            if ( results.rows.length > 0) {
                const reputation = results.rows[0].reputation+10 // This assumes a single up vote, we may need to recalculate everythign.

                const updateResults = await this.database.query(`
                    UPDATE user_field_reputation SET reputation = $1 WHERE user_id = $2 AND field_id = $3
                `, [ reputation, user.id, field.id ])
            }

        
        }
    }

    async recalculateReputationForPaper(user, paper) {

    }

    async recalculateReputation(user, field) {
        // Calculate Total Reputation across all fields.
        if ( ! field ) {
               




        } else {

        }

    }

}
