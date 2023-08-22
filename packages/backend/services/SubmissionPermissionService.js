/***
 * Submissions are visible if:
 *
 * The authenticated user is:
 * - An editor of Journal(submission.journalId)
 * - An author of Paper(submission.paperId)
 * - A reviewer for Journal(submission.journalId) and Submission.status == 'review'
 *
 * OR
 *
 * Submission.status == 'published'
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
