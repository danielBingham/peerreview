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
const PaperDAO = require('../daos/PaperDAO')
const PaperVersionDAO = require('../daos/PaperVersionDAO')
const SubmissionService = require('./SubmissionService')
const ServiceError = require('../errors/ServiceError')

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
module.exports = class PaperService {

    constructor(core)  {
        this.database = core.database
        this.logger = core.logger

        this.submissionService = new SubmissionService(core)
        this.paperDAO = new PaperDAO(core)
        this.paperVersionDAO = new PaperVersionDAO(core)
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
    async getVisiblePaperIds(user) {
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
    async canViewPaper(user, paperId) {
        const userId = user ? user.id : 0

        const results = await this.database.query(`
            SELECT papers.id FROM papers
                LEFT OUTER JOIN paper_authors ON papers.id = paper_authors.paper_id
            WHERE papers.id = $1 AND (papers.show_preprint = true OR paper_authors.user_id = $2)
        `, [ paperId, userId ])

        if ( results.rows.length > 0 ) {
            return true
        }

        return await this.submissionService.canViewSubmission(user, paperId)
    }

    async getMostRecentVisibleVersion(user, paperId, paper, activeSubmissionInfo) {
        if ( ! paper ) {
            const paperResults = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ paperId ])
            paper = paperResults.dictionary[paperId]
        }
        
        const isAuthor = paper.authors.find((a) => a.userId == user.id) ? true : false

        if ( ! activeSubmissionInfo ) {
            activeSubmissionInfo = await this.submissionService.getActiveSubmission(user, paperId)
        }

        const paperVersionResults = await this.paperVersionDAO.selectPaperVersions('WHERE paper_versions.paper_id = $1', [paperId])

        let paperVersionId = null

        // If the user is an Author, use the most recent version.
        if ( isAuthor ) {
            paperVersionId = paperVersionResults.list[0]
        }

        // If the paper is published, use the published version.
        else if ( ! paper.isDraft ) {
            for( const id of paperVersionResults.list) {
                if ( paperVersionResults.dictionary[id].isPublished ) {
                    paperVersionId = id  
                }
            }

            if ( ! paperVersionId ) {
                throw new ServiceError('missing-version',
                    `Paper(${paperId}) is published, but no versions are published!`)
            }
        }

        // If we have an active submission, then the user is acting on that submission, use the most recent submitted version.
        else if (  activeSubmissionInfo ) {
            for(const id of paperVersionResults.list) {
                if ( paperVersionResults.dictionary[id].isSubmitted ) {
                    paperVersionId = id 
                }
            }

            // If no versions have been submitted then we're in an invalid state.
            if ( ! paperVersionId ) {
                throw new ServiceError('missing-version', 
                    `Paper(${paperId}) is submitted, but no versions have been submitted!`)
            }
        } 

        // If they aren't an author, then we use the most recent preprinted version.
        else if ( paper.showPreprint ) {
            for(const id of paperVersionResults.list) {
                if ( paperVersionResults.dictionary[id].isPreprint) {
                    paperVersionId = id 
                }
            }

            // If no versions have been submitted then we're in an invalid state.
            if ( ! paperVersionId ) {
                throw new ServiceError('missing-version', 
                    `Paper(${paperId}) is a preprint, but no versions have been preprinted!`)
            }
        } 

        // If we get here, then they don't actually have permission to post any events against this paper. 
        else {
            throw new ServiceError('not-authorized', `Attempt to create event on Paper(${paperId}) without authorization.`)
        }

        return paperVersionResults.dictionary[paperVersionId]
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

    /**
     * Retrieves all ids of the user's current private drafts.
     */
    async getPrivateDrafts(userId) {
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
    async getUserSubmissions(userId) {
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
