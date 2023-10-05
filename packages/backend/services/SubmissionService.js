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
module.exports = class SubmissionService {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
    }

    async getActiveSubmission(user, paperId) {
        // Get the currently active submission for the paper.
        const results = await this.database.query(`
            SELECT journal_submissions.id, journal_submissions.journal_id as "journalId"
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

        // Determine whether the user is an author or a member of the journal
        // with the active submission.
        const userResults = await this.database.query(`
            SELECT journal_members.journal_id, paper_authors.paper_id
                FROM journal_submissions
                    LEFT OUTER JOIN journal_members ON journal_submissions.journal_id = journal_members.journal_id
                    LEFT OUTER JOIN paper_authors ON paper_authors.paper_id = journal_submissions.paper_id
                WHERE ( paper_authors.user_id = $1 OR journal_members.user_id = $1 ) 
                    AND journal_submissions.paper_id = $2
                    AND journal_submissions.journal_id = $3
        `, [ user.id, paperId, results.rows[0].journalId ])

        // If the user is neither a member, nor an author, then there is no
        // active submission for this event.
        if ( userResults.rows.length <= 0 ) {
            return null
        }

        if ( userResults.rows[0].journal_id === null && userResults.rows[0].paper_id === null) {
            return null
        }

        return results.rows[0]
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
