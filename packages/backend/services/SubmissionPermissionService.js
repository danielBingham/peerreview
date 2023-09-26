/***
 * Manages Submission Visibility
 *
 *
 * == Public == 
 *
 * Status: any
 *  - public
 *
 * == Open-Public == 
 *
 * Status: ! published or rejected
 * - authors, corresponding-authors, managing-editors, editors, reviewers
 *
 * Status: published or rejected
 * - public
 *
 * == Open == 
 *
 * Status: any
 * - authors, corresponding-authors, managing-editors, editors, reviewers
 * 
 * == Closed == 
 *
 * Status: submitted
 * - authors, corresponding-authors, managing-editors, assigned-editors
 *
 * Status: review
 * - authors, corresponding-authors, managing-editors, assigned-editors, assigned-reviewers
 *
 * Status: proofing, rejected, retracted
 * - authors, corresponding-authors, managing-editors, assigned-editors
 *
 * Status: published
 * - public
 *
 */
module.exports = class SubmissionPermissionService {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
    }

    async getVisibleSubmissionIds(userId) {
        const results = await this.database.query(`
            SELECT DISTINCT papers.id 
                FROM papers
                    LEFT OUTER JOIN journal_submissions ON papers.id = journal_submissions.paper_id
                    LEFT OUTER JOIN journal_members ON journal_submissions.journal_id = journal_members.journal_id
            WHERE 
                (journal_members.user_id = $1 AND (journal_members.permissions = 'editor' OR journal_members.permissions = 'owner'))
                OR (journal_members.user_id = $1 AND journal_submissions.status = 'review' AND journal_members.permissions = 'reviewer')
                OR journal_submissions.status = 'published'
                OR papers.id IN (SELECT paper_id FROM paper_authors WHERE user_id = $1)
        `, [ userId ])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    async filterVisibleSubmissions(submissionResults, user) {

    }

}
