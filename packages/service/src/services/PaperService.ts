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
import { Pool, Client } from 'pg'

import { Core } from '@journalhub/core' 
import { User } from '@journalhub/model'

import { SubmissionService } from './SubmissionService'

/**
 * Manages Paper Visibility
 *
 * == Drafts ==
 * - authors
 * - corresponding-authors
 *
 * == Preprints ==
 * - public
 *
 * == Submissions ==
 * If the submission is visible, paper is visible
 *
 */
export class PaperService {
    core: Core
    database: Pool | Client

    submissionService: SubmissionService

    constructor(core: Core, database?: Pool | Client)  {
        this.core = core

        this.database = core.database
        if ( database ) {
            this.database = database
        }

        this.submissionService = new SubmissionService(core)
    }

    /**
     * Returns the papers.id of papers that are visible to `user`.
     *
     * Papers are visible if:
     * - User is an author.
     * - Papers have a preprint.
     * - Papers have a submission visible to the user.
     *
     * TODO Do we want to show the paper when at least one event is visible to
     * the user?  Or make events subservient to the paper's status?  Is making
     * an event 'public' enough to make the paper public or does the paper have
     * to be shared as a preprint / publication first and then the event is
     * publicly visible?
     *
     * @param {User}    user    The user we want to get visible papers for.
     *
     * @return {int[]}  An array containing the ids of the visible papers.
     */
    async getVisiblePaperIds(user: User): Promise<number[]> {
        const visibleSubmissionIds = await this.submissionService.getVisibleSubmissionIds(user)

        const results = await this.database.query(`
            SELECT papers.id FROM papers
                LEFT OUTER JOIN journal_submissions ON papers.id = journal_submission.paper_id
                LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
            WHERE papers.show_preprint = true
                OR journal_submissions.id = ANY($1::bigint[]) 
                OR paper_authors.user_id = $2
        `, [ visibleSubmissionIds, user.id ])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    /**
     * Determine whether `user` can view `paperId`.
     *
     * @see this.getVisiblePaperIds() for visibility rules.
     *
     * @param   {User}  user    The user who's visibility we want to check.
     * @param   {int}   paperId The id of the paper we want to check whether `user` can see.
     *
     * @return  {boolean}   True if `user` can see `paperId`, false otherwise.
     */
    async canViewPaper(user: User, paperId: number): Promise<boolean> {
        const results = await this.database.query(`
            SELECT papers.id FROM papers
                LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
            WHERE papers.id = $1 AND (papers.show_preprint = true OR paper_authors.user_id = $2)
        `, [ paperId, user.id ])

        if ( results.rows.length > 0 ) {
            return true
        }

        return await this.submissionService.canViewSubmission(user, paperId)
    }

    async getPreprints(): Promise<number[]> {
        const results = await this.database.query(`
            SELECT id FROM papers WHERE is_draft = true AND show_preprint = true
        `, [])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    async getVisibleDraftSubmissions(userId: number): Promise<number[]> {
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

    async getDrafts(userId: number): Promise<number[]> {
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

    /**
     * Retrieves all ids of the user's current private drafts.
     */
    async getPrivateDrafts(userId: number): Promise<number[]> {
        const results = await this.database.query(`
            SELECT DISTINCT id FROM papers
                LEFT OUTER JOIN paper_authors ON paper_authors.paper_id = papers.id
            WHERE paper_authors.user_id = $1 
                AND papers.is_draft = true 
                AND papers.show_preprint = false
        `, [ userId ])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

    /**
     * Gets all of a user's submissions to journals. 
     */
    async getUserSubmissions(userId: number) {
        const results = await this.database.query(`
            SELECT DISTINCT id FROM papers
                LEFT OUTER JOIN paper_authors ON paper_authors.paper_id = papers.id
            WHERE paper_authors.user_id = $1 
                AND papers.is_draft = true 
                AND papers.id IN ( SELECT paper_id FROM journal_submissions)
        `, [ userId ])

        if ( results.rows.length <= 0 ) {
            return []
        }

        return results.rows.map((r) => r.id)
    }

}
