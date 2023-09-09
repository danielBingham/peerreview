
const PaperEventDAO = require('../daos/PaperEventDAO')

module.exports = class PaperEventService { 

    constructor(core) {
        this.core = core

        this.paperEventDAO = new PaperEventDAO(core)
    }

    async getActiveSubmissionId(paperId) {
        const results = await this.core.database.query(`
            SELECT journal_submissions.id
                FROM journal_submissions
                WHERE journal_submissions.status != 'published' 
                    AND journal_submissions.status != 'rejected'
                    AND journal_submissions.status != 'retracted'
                    AND journal_submissions.paper_id = $1
                LIMIT 1
        `, [ paperId ])

        if ( results.rows.length <= 0 ) {
            return null 
        }

        return results.rows[0].id
    }

    async getCurrentPaperVersion(paperId) {
        const versionResults = await this.core.database.query(
            `SELECT version FROM paper_versions WHERE paper_id = $1 ORDER BY version desc`, 
            [ paperId ]
        )
        return versionResults.rows[0].version
    }

    async getEventVisibility(user, event) {
        return [ 'public' ]
    }

    async createEvent(user, event) {

        if ( ! event.submissionId ) {
            event.submissionId = await this.getActiveSubmissionId(event.paperId)
        }

        // If we don't have a version already, grab it from the database.
        if ( ! event.version ) {
            event.version = await this.getCurrentPaperVersion(event.paperId)
        }

        event.visibility = await this.getEventVisibility(user, event)

        console.log(event)
        await this.paperEventDAO.insertEvent(event)
    }

}
