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
    referee: 0,

    /**
     * Can publish.  Multiple of field.average_reputation
     */
    publish: 2
}

module.exports = class ReputationPermissionService {

    constructor(database, logger)  {
        this.database = database
        this.logger = logger
    }

    async getVisibleDrafts(userId) {
        const sql = `
            SELECT DISTINCT 
                    papers.id
                FROM papers
                    JOIN paper_fields ON papers.id = paper_fields.paper_id
                    LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
                    JOIN fields ON paper_fields.field_id = fields.id
                    JOIN user_field_reputation ON paper_fields.field_id = user_field_reputation.field_id
                WHERE papers.is_draft = true 
                    AND ((user_field_reputation.user_id = $1 AND user_field_reputation.reputation > fields.average_reputation*${THRESHOLDS.review}) OR (paper_authors.user_id = $1))
                GROUP BY papers.id
        `

        const results = await this.database.query(sql, [ userId ])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    getThresholds() {
        return THRESHOLDS
    }

    async canReview(userId, paperId) {
        const sql = `
            SELECT DISTINCT
                    fields.id
                FROM fields
                    JOIN paper_fields on fields.id = paper_fields.field_id
                    JOIN user_field_reputation on fields.id = user_field_reputation.field_id
                WHERE user_field_reputation.user_id = $1 
                    AND paper_fields.paper_id = $2 
                    AND user_field_reputation.reputation > fields.average_reputation * ${THRESHOLDS.review}
        `

        const results = await this.database.query(sql, [userId, paperId])

        // If they have enough reputation - great!  We're done here.
        if ( results.rows.length > 0 ) {
            return true
        }
        
        const authorResults = await this.database.query( `
                SELECT user_id from paper_authors where paper_id = $1 AND user_id = $2
            `, [ review.paperId, userId ])

        // They are an author on the paper.  They are allowed.
        if ( authorResults.rows.length > 0 ) {
            return true
        }

        return false
    }

    async canReferee(userId, paperId) {
        const sql = `
            SELECT DISTINCT
                    fields.id
                FROM fields
                    JOIN paper_fields on fields.id = paper_fields.field_id
                    JOIN user_field_reputation on fields.id = user_field_reputation.field_id
                WHERE user_field_reputation.user_id = $1 
                    AND paper_fields.paper_id = $2 
                    AND user_field_reputation.reputation > fields.average_reputation * ${THRESHOLDS.referee}
        `

        const results = await this.database.query(sql, [userId, paperId])

        return results.rows.length > 0
    }

    async canPublish(userId, paper) {

        const fields = paper.fields.map((f) => f.id)

        const sql = `
            SELECT DISTINCT
                    fields.id
                FROM fields
                    JOIN user_field_reputation on fields.id = user_field_reputation.field_id
                WHERE user_field_reputation.user_id = $1 
                    AND field.id = ANY($2::bigint[])
                    AND user_field_reputation.reputation > fields.average_reputation * ${THRESHOLDS.publish}
        `

        const results = await this.database.query(sql, [userId, fields])

        return results.rows.length > 0
    }

}
