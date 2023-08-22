
module.exports = class PaperPermissionsService {

    constructor(core)  {
        this.database = core.database
        this.logger = core.logger
    }

    async getPreprints() {
        const results = await this.database.query(`
            SELECT id FROM papers WHERE is_draft = true AND show_preprint = true
        `, [])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    async getVisibleDraftSubmissions(userId) {
        const results = await this.database.query(`
            SELECT DISTINCT papers.id FROM papers
                LEFT OUTER JOIN journal_submissions ON papers.id = journal_submissions.paper_id
                LEFT OUTER JOIN journal_members ON journal_submissions.journal_id = journal_members.journal_id
            WHERE 
                papers.is_draft = true AND journal_submissions.status != 'rejected'
                AND ((journal_members.user_id = $1 AND (journal_members.permissions = 'editor' OR journal_members.permissions = 'owner'))
                    OR (journal_members.user_id = $1 AND journal_submissions.status = 'review' AND journal_members.permissions = 'reviewer'))
                AND papers.id NOT IN (SELECT paper_id FROM paper_authors WHERE user_id = $1)
        `, [ userId ])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    async getDrafts(userId) {
        const results = await this.database.query(`
            SELECT DISTINCT id FROM papers
                LEFT OUTER JOIN paper_authors ON paper_authors.paper_id = papers.id
            WHERE paper_authors.user_id = $1 AND papers.is_draft = true
        `, [ userId ])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
            
    }


}
