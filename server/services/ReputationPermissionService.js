const THRESHOLDS = {
    /**
     * Can review papers. Multiple of field.average_reputation 
     */
    review: 5,

    /**
     * Can exercise literature integrity control.  IE Vote/respond.
     *
     * Multiple of field.average_reputation
     */
    referee: 10,

    /**
     * Can publish.  Multiple of field.average_reputation
     */
    publish: 0
}

module.exports = class ReputationPermissionService {

    constructor(database, logger)  {
        this.database = database
        this.logger = logger
    }

    async getVisibleDrafts(userId) {
        let admin = false
        const userResult = await this.database.query(`SELECT id, permissions FROM users WHERE users.id = $1`, [ userId ])
        if ( userResult.rows[0].permissions == 'superadmin' || userResult.rows[0].permissions == 'admin' ) {
            admin = true 
        }

        const sql = `
            SELECT DISTINCT 
                    papers.id
                FROM papers
                    JOIN paper_fields ON papers.id = paper_fields.paper_id
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
                    JOIN fields ON paper_fields.field_id = fields.id
                    JOIN user_field_reputation ON paper_fields.field_id = user_field_reputation.field_id
                WHERE papers.is_draft = true 
                    AND ((user_field_reputation.user_id = $1 AND user_field_reputation.reputation > fields.average_reputation*${THRESHOLDS.review}) OR (paper_authors.user_id = $1) OR $2)
                GROUP BY papers.id
        `

        const results = await this.database.query(sql, [ userId, admin ])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    getThresholds() {
        return THRESHOLDS
    }

    async canReview(userId, paperId) {
        let admin = false
        const userResult = await this.database.query(`SELECT id, permissions FROM users WHERE users.id = $1`, [ userId ])
        if ( userResult.rows[0].permissions == 'superadmin' || userResult.rows[0].permissions == 'admin' ) {
            admin = true 
        }

        const sql = `
            SELECT DISTINCT
                    fields.id
                FROM fields
                    JOIN paper_fields on fields.id = paper_fields.field_id
                    JOIN user_field_reputation on fields.id = user_field_reputation.field_id
                WHERE ( user_field_reputation.user_id = $1 
                    AND paper_fields.paper_id = $2 
                    AND user_field_reputation.reputation > fields.average_reputation * ${THRESHOLDS.review}) OR $3
        `

        const results = await this.database.query(sql, [userId, paperId, admin])

        // If they have enough reputation - great!  We're done here.
        if ( results.rows.length > 0 ) {
            return true
        }
        
        const authorResults = await this.database.query( `
                SELECT user_id from paper_authors where paper_id = $1 AND user_id = $2
            `, [ paperId, userId ])

        // They are an author on the paper.  They are allowed.
        if ( authorResults.rows.length > 0 ) {
            return true
        }

        return false
    }

    async canReferee(userId, paperId) {
        let admin = false
        const userResult = await this.database.query(`SELECT id, permissions FROM users WHERE users.id = $1`, [ userId ])
        if ( userResult.rows[0].permissions == 'superadmin' || userResult.rows[0].permissions == 'admin' ) {
            admin = true 
        }

        const sql = `
            SELECT DISTINCT
                    fields.id
                FROM fields
                    JOIN paper_fields on fields.id = paper_fields.field_id
                    JOIN user_field_reputation on fields.id = user_field_reputation.field_id
                WHERE (user_field_reputation.user_id = $1 
                    AND paper_fields.paper_id = $2 
                    AND user_field_reputation.reputation > fields.average_reputation * ${THRESHOLDS.referee}) OR $3
        `

        const results = await this.database.query(sql, [userId, paperId, admin])

        return results.rows.length > 0
    }

    async canPublish(userId, paper) {
        let admin = false
        const userResult = await this.database.query(`SELECT id, permissions FROM users WHERE users.id = $1`, [ userId ])
        if ( userResult.rows[0].permissions == 'superadmin' || userResult.rows[0].permissions == 'admin' ) {
            admin = true 
        }

        const fieldIds = paper.fields.map((f) => f.id)
        const authorIds = paper.authors.map((a) => a.user.id)

        // Must be an author to publish a paper.
        if ( ! authorIds.find((aid) => aid == userId) ) {
            return {
                canPublish: false,
                missingFields: [] 
            }
        }

        // This should select one row for each field that at least one author
        // has enough reputation to publish in.  If any of the fields are
        // missing, that should mean that no authors had enough reputation to
        // publish in it.
        const sql = `
            SELECT DISTINCT
                    fields.id
                FROM fields
                    JOIN user_field_reputation on fields.id = user_field_reputation.field_id
                WHERE (user_field_reputation.user_id = ANY($1::bigint[]) 
                    AND fields.id = ANY($2::bigint[])
                    AND user_field_reputation.reputation > fields.average_reputation * ${THRESHOLDS.publish}) OR $3
        `

        const results = await this.database.query(sql, [authorIds, fieldIds, admin])

        let missingFields = []
        if ( results.rows.length > 0 ) {
            for(const fieldId of fieldIds ) {
                if ( ! results.rows.find((f) => f.id == fieldId) ) {
                    missingFields.push(fieldId)
                }
            }
        } else {
            missingFields = fieldIds
        }

        return {
            canPublish: results.rows.length == fieldIds.length,
            missingFields: missingFields
        }
    }

}
