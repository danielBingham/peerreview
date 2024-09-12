/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

/******************************************************************************
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
 ******************************************************************************/
import { Core } from '@journalhub/core' 
import { User } from '@journalhub/model'

export interface ActiveSubmission {
    id: number
    journalId: number
}

export class SubmissionService {
    core: Core

    constructor(core: Core) {
        this.core = core
    }

    async getActiveSubmission(user: User, paperId: number): Promise<ActiveSubmission|null> {
        // Get the currently active submission for the paper.
        const results = await this.core.database.query(`
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
        const userResults = await this.core.database.query(`
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

    /**
     * Get the submissionIds that are visible to `user`.
     *
     * This just controls the submission visibility.  Event visibility is
     * subservient to the visibility of the submission and paper themselves,
     * which are controlled by the journal's models.  A paper is visible if its
     * submission is visible.
     *
     * Submissions are visible if:
     * - The model is 'public'
     * - The model is 'open-public' and the submission is published, or the
     *   user is a journal member.
     * - The model is 'open' and the submission is published or the user is a
     *   journal member.
     * - The model is 'closed' and the submisison is published or the user is
     *   either a managing editor or assigned to the submission.
     *
     * @param {User}    user    The user who's visibility we want to check.
     *
     * @return  {int[]} An array of the visible submissionIds.
     */
    async getVisibleSubmissionIds(user: User): Promise<number[]> {
        const sql = `
            SELECT DISTINCT journal_submissions.id
                FROM journal_submissions
                    LEFT OUTER JOIN journals ON journal_submissions.journal_id = journals.id
                    LEFT OUTER JOIN journal_members ON journal_submissions.journal_id = journal_members.journal_id
                    LEFT OUTER JOIN journal_submission_editors ON journal_submissions.id = journal_submission_editors.submission_id
                    LEFT OUTER JOIN journal_submission_reviewers ON journal_submissions.id = journal_submission_reviewers.submission_id
            WHERE 
                journals.model = 'public'
                    OR (journals.model = 'open-public' AND (journal_submissions.status = 'published' 
                        ${ user ? 'OR journal_members.user_id = $1' : ''}))
                    OR (journals.model = 'open-closed' AND (journal_submissions.status = 'published' 
                        ${ user ? 'OR journal_members.user_id = $1' : '' }))
                    OR (journals.model = 'closed' 
                        AND (journal_submissions.status = 'published' 
                            ${ user ? `OR ( journal_members.permissions = 'owner' 
                                OR journal_submission_editors.user_id = $1 
                                OR journal_submission_reviewers.user_id = $1
                                )` : '' }
                            )
                       )
        `
        const params = []
        if ( user ) {
            params.push(user.id)
        }

        const results = await this.core.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    async canViewSubmission(user: User, paperId: number): Promise<boolean> {
        const visibleSubmissionIds = await this.getVisibleSubmissionIds(user)

        const results = await this.core.database.query(`
            SELECT paper_id FROM journal_submissions WHERE id = ANY($1::bigint[]) AND paper_id = $2
        `, [ visibleSubmissionIds, paperId])

        if ( results.rows.length > 0 ) {
            return true
        }

        return false
    }

}
