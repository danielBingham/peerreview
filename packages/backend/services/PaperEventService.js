/******************************************************************************
 * PaperEventService
 *
 * In addition to creating events, the Paper Event Service is the primary
 * manager of journal permissions and transparency.  This service is what
 * ultimately controls who can see and do what on a paper.  We use visibility -
 * stored on the event - to control access.  Since everything that happens on a
 * paper has an event, the event can then control everything that happens on a
 * paper.
 *
 * Visibility is affected first by the stage the paper is in (draft vs preprint
 * vs submission), then by the model of the journal the paper is submitted to,
 * and finally it can be overridden on a per-event level.
 *
 * In the draft stage, only authors can see events.  
 *
 * On preprints, events are public.
 *
 * For journal submissions, it is the journal transparency model that controls
 * visibility and access.  This model provides a default and then certain roles
 * can override it per event.  Which roles can override which events varies by
 * journal model.
 *
 * There are four initial models: public, open-open, open-closed, closed.
 *
 * In public:
 * - Everything is visible to everyone.
 *
 * In Open-open:
 * - Everything is visible to all journal members and authors during submission
 *   review.
 * - After the paper is published, everything becomes visible to everyone.
 *
 * In open-closed:
 * - Everything is visible to all journal members and authors during submission
 *   review.
 * - Visibility stays with only journal members and authors after submission
 *   review.
 *
 * In closed:
 * - Submissions in "submitted" are visible to only "managing-editors",
 *   "assigned-editors", and "authors".
 * - Submissions in "review" are visible to "managing-editors",
 *   "assigned-editors", "assigned-reviewers", and "authors". 
 * - Submissions in "rejected", "published", "accepted", "production", and "proofing" are
 *   visible to "managing-editors", "assigned-editors", and "authors". 
 *
 * If a submission is a preprint and a submission to a journal with a less
 * permissive model, then events on the preprint will be public, but those from
 * journal members will follow the journal's model.  Authors will need to
 * choose the level of visibility of their interactions.
 *
 * ****************************************************************************/


const PaperEventDAO = require('../daos/PaperEventDAO')

module.exports = class PaperEventService { 

    constructor(core) {
        this.core = core

        this.paperEventDAO = new PaperEventDAO(core)

        this.visibilityByModelAndEvent = {
            'public': {
                'version-uploaded': [ 'public' ],
                'preprint-posted': [ 'public' ],
                'review-posted': [ 'public' ], 
                'review-comment-reply-posted': [ 'public' ],
                'comment-posted': [ 'public' ],
                'submitted-to-journal': [ 'public' ], 
                'submission-status-changed': [ 'public' ],
                'reviewer-assigned': [ 'public' ],
                'reviewer-unassigned': [ 'public' ],
                'editor-assigned': [ 'public' ],
                'editor-unassigned': [ 'public' ]
            }, 
            'open-public': {
                'version-uploaded': [ 
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'preprint-posted': [ 
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'review-posted': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ], 
                'comment-posted': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'submitted-to-journal': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ], 
                'submission-status-changed': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'reviewer-assigned': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'reviewer-unassigned': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'editor-assigned': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],                
                'editor-unassigned': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ]
            }, 
            'open-closed': {
                'version-uploaded': [ 
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'preprint-posted': [ 
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'review-posted': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ], 
                'comment-posted': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'submitted-to-journal': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ], 
                'submission-status-changed': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'reviewer-assigned': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'reviewer-unassigned': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'editor-assigned': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],                
                'editor-unassigned': [
                    'managing-editor',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ]
            },
            'closed': {
                'version-uploaded': [ 
                    'managing-editor',
                    'assigned-editors',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'preprint-posted': [ 
                    'managing-editor',
                    'assigned-editors',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'review-posted': [
                    'managing-editor',
                    'assigned-editors',
                ], 
                'comment-posted': [
                    'managing-editor',
                    'assigned-editors',
                    'assigned-reviewers',
                    'corresponding-author',
                    'authors'
                ],
                'submitted-to-journal': [
                    'managing-editor',
                    'corresponding-author',
                    'authors'
                ], 
                'submission-status-changed': [
                    'managing-editor',
                    'assigned-editors'
                ],
                'reviewer-assigned': [
                    'managing-editor',
                    'assigned-editors',
                    'assigned-reviewers'
                    
                ],
                'reviewer-unassigned': [
                    'managing-editor',
                    'assigned-editors',
                    'assigned-reviewers'

                ],
                'editor-assigned': [
                    'managing-editor',
                    'assigned-editors'
                ],                
                'editor-unassigned': [
                    'managing-editor',
                    'assigned-editors'
                ]
            }
        }
    }

    // ========================================================================
    // Event Creation
    // ========================================================================

    async getActiveSubmission(user, paperId) {
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

    async getCurrentPaperInfo(paperId) {
        const versionResults = await this.core.database.query(
            `SELECT paper_versions.version, papers.show_preprint as "showPreprint" 
                FROM paper_versions 
                    LEFT OUTER JOIN papers ON papers.id = paper_versions.paper_id
                WHERE papers.id = $1 ORDER BY paper_versions.version desc
                LIMIT 1
            `, [ paperId ]
        )
        return versionResults.rows[0]
    }

    async getEventVisibility(user, event, paperInfo, activeSubmissionInfo) {
        let visibility = [ 'authors' ]

        if ( activeSubmissionInfo && this.core.features.hasFeature('journal-permission-models-194') ) {
            const journalResults = await this.core.database.query(`
                SELECT model FROM journals WHERE id = $1
            `, [ activeSubmissionInfo.journalId ])

            if ( journalResults.rows.length <= 0 ) {
                throw new DAOError('missing-journal', 
                    `Unable to find Journal(${activeSubmissionInfo.journalId}) for Submission(${activeSubmissionInfo.id}).`)
            }

            const journalModel = journalResults.rows[0].model
            visibility = this.visibilityByModelAndEvent[journalModel][event.type]
        } else if ( paperInfo.showPreprint ) {
            visibility = [ 'public' ]
        }

        return visibility
    }

    async createEvent(user, event) {
        const activeSubmissionInfo = await this.getActiveSubmission(user, event.paperId)
        if ( ! event.submissionId && activeSubmissionInfo ) {
            event.submissionId = activeSubmissionInfo.id
        }

        const paperInfo = await this.getCurrentPaperInfo(event.paperId)
        if ( ! event.version ) {
            event.version = paperInfo.version
        }

        if ( ! event.visibility ) {
            event.visibility = await this.getEventVisibility(user, event, paperInfo, activeSubmissionInfo)
        }

        await this.paperEventDAO.insertEvent(event)
    }

    // ========================================================================
    // Event Acessing 
    // ========================================================================
    
    async getVisibleEventIds(userId, paperId) {
        const userRoles = ['public']

        
        // TODO handle post-publish open models

        let submissionMap = {}

        // ======== Collect Roles for the current user ========================

        if ( this.core.features.hasFeature('journal-permission-models-194') ) {
            const journalResults = await this.core.database.query(`
                SELECT 
                        journals.id as "journalId", 
                        journal_submissions.id as "submissionId", 
                        journal_members.permissions as role,
                        journal_submission_editors.user_id as "editorId",
                        journal_submission_reviewers.user_id as "reviewerId"
                    FROM journals
                        LEFT OUTER JOIN journal_submissions ON journals.id = journal_submissions.journal_id
                        LEFT OUTER JOIN journal_members ON journal_submissions.journal_id = journal_members.journal_id
                        LEFT OUTER JOIN journal_submission_editors 
                            ON journal_submission_editors.submission_id = journal_submissions.id
                                AND journal_submission_editors.user_id = journal_members.user_id
                        LEFT OUTER JOIN journal_submission_reviewers 
                            ON journal_submission_reviewers.submission_id = journal_submissions.id
                                AND journal_submission_reviewers.user_id = journal_members.user_id
                    WHERE journal_submissions.paper_id = $2 
                        AND (
                            journal_members.user_id = $1 
                                OR  ( 
                                    journal_submissions.status = 'published' 
                                        AND (journals.model = 'public' OR journals.model = 'open-public')
                                )
                        )
            `, [ userId, paperId ])

            if ( journalResults.rows.length > 0 ) {
                submissionMap = journalResults.rows.reduce(function(map, row) {
                    if ( ! map[row.submissionId] ) {
                        map[row.submissionId] = {
                            journalId: row.journalId,
                            role: row.role
                        }

                        if ( row.editorId == userId ) {
                            map[row.submissionId].assignedEditor = true
                        }
                        if ( row.reviewerId == userId ) {
                            map[row.submissionId].assignedReviewer = true
                        }
                    }
                    return map
                }, {})
            }
        }

        // ========  Authors, Corresponding-Authors ===========================
        
        if ( userId ) {
            const authorResults = await this.core.database.query(`
                SELECT owner FROM paper_authors WHERE user_id = $1 AND paper_id = $2
            `, [ userId, paperId ])

            if ( authorResults.rows.length > 0 ) {
                if ( authorResults.rows[0].owner ) {
                    userRoles.push('corresponding-author')
                } 
                userRoles.push('authors')
            }
        }
            

        let eventConditions = 'paper_events.visibility && $1'
        const params = [ userRoles ]
        let count = 2
        
        // ======== managing-editors, editors, reviewers, assigned-editors, assigned-reviewers 
      
        const permissionsToRoleMap = {
            'owner': 'managing-editor',
            'editor': 'editors',
            'reviewer': 'reviewers'
        }
        for(const [submissionId, map] of Object.entries(submissionMap)) {
            const roles = [ ...userRoles ]

            // TODO: limit visibility of "assigned-editors" and
            // "assigned-reviewers" to the assignee only.
            if ( map.assignedEditor ) {
                roles.push('assigned-editors')
            } 
            if ( map.assignedReviewer ) {
                roles.push('assigned-reviewers')
            }
            
            roles.push(permissionsToRoleMap[map.role])


            eventConditions += ` OR (
                paper_events.visibility && $${count}::paper_event_visibility[] 
                    AND paper_events.submission_id = $${count+1}
            )`

            count += 2
            params.push(roles)
            params.push(submissionId)
        }

        const sql = `
            SELECT paper_events.id
                FROM paper_events
            WHERE ${eventConditions}
        `
        const results = await this.core.database.query(sql, params)

        const visibleEventIds = results.rows.map((r) => r.id)
        return visibleEventIds
    }

    async isEventVisible(eventId, userId) {

    }

    async canEditEvent(eventId, userId) {

    }
}
