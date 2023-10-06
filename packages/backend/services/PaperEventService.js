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

const SubmissionService = require('./SubmissionService')

const ServiceError = require('../errors/ServiceError')

module.exports = class PaperEventService { 

    constructor(core) {
        this.core = core

        this.paperEventDAO = new PaperEventDAO(core)

        this.submissionService = new SubmissionService(core)

        this.visibilityByModelAndEvent = {
            'public': {
                'paper:new-version': [ 'public' ],
                'paper:preprint-posted': [ 'public' ],
                'paper:new-review': [ 'public' ], 
                'paper:comment-posted': [ 'public' ],
                'review:comment-reply-posted': [ 'public' ],
                'submission:new': [ 'public' ], 
                'submission:new-review': [ 'public' ],
                'submission:status-changed': [ 'public' ],
                'submission:reviewer-assigned': [ 'public' ],
                'submission:reviewer-unassigned': [ 'public' ],
                'submission:editor-assigned': [ 'public' ],
                'submission:editor-unassigned': [ 'public' ]
            }, 
            'open-public': {
                'paper:new-version': [ 
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'paper:preprint-posted': [ 
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'paper:new-review': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ], 
                'paper:comment-posted': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'submission:new': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ], 
                'submission:new-review': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ], 
                'submission:status-changed': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'submission:reviewer-assigned': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'submission:reviewer-unassigned': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'submission:editor-assigned': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],                
                'submission:editor-unassigned': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ]
            }, 
            'open-closed': {
                'paper:new-version': [ 
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'paper:preprint-posted': [ 
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'paper:new-review': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ], 
                'paper:comment-posted': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'submission:new': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ], 
                'submission:new-review': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ], 
                'submission:status-changed': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'submission:reviewer-assigned': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'submission:reviewer-unassigned': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'submission:editor-assigned': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],                
                'submission:editor-unassigned': [
                    'managing-editors',
                    'editors',
                    'assigned-editors',
                    'reviewers',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ]
            },
            'closed': {
                'paper:new-version': [ 
                    'managing-editors',
                    'assigned-editors',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'paper:preprint-posted': [ 
                    'managing-editors',
                    'assigned-editors',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'paper:new-review': [
                    'managing-editors',
                    'assigned-editors',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ], 
                'paper:comment-posted': [
                    'managing-editors',
                    'assigned-editors',
                    'assigned-reviewers',
                    'corresponding-authors',
                    'authors'
                ],
                'submission:new': [
                    'managing-editors',
                    'corresponding-authors',
                    'authors'
                ], 
                'submission:new-review': [
                    'managing-editors',
                    'assigned-editors',
                ], 
                'submission:status-changed': [
                    'managing-editors',
                    'assigned-editors'
                ],
                'submission:reviewer-assigned': [
                    'managing-editors',
                    'assigned-editors',
                    'assigned-reviewers'
                    
                ],
                'submission:reviewer-unassigned': [
                    'managing-editors',
                    'assigned-editors',
                    'assigned-reviewers'

                ],
                'submission:editor-assigned': [
                    'managing-editors',
                    'assigned-editors'
                ],                
                'submission:editor-unassigned': [
                    'managing-editors',
                    'assigned-editors'
                ]
            }
        }
    }

    // ========================================================================
    // Event Creation
    // ========================================================================

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
            if ( ! visibility ) {
                throw new ServiceError('missing-visibility',
                    `model: ${journalModel}, type: ${event.type}, Visibility: ${this.visibilityByModelAndEvent[journalModel][event.type]}`)
            }
        } else if ( paperInfo.showPreprint ) {
            visibility = [ 'public' ]
        }

        return visibility
    }

    async createEvent(user, event) {
        const activeSubmissionInfo = await this.submissionService.getActiveSubmission(user, event.paperId)
        if ( ! event.submissionId && activeSubmissionInfo ) {
            event.submissionId = activeSubmissionInfo.id
        }

        if ( event.type == 'new-review' && activeSubmissionInfo !== null) {
            event.type = 'submission:new-review'
        } else if ( event.type == 'new-review' && activeSubmissionInfo === null ) {
            event.type = 'paper:new-review'
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
    
    async getVisibleEventIds(userId) {
        const userRoles = ['public']

        let submissionMap = {}
        let authorMap = {}

        // ======== Collect Journal Roles for the current user ========================

        if ( this.core.features.hasFeature('journal-permission-models-194') ) {
            const sql = `
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
                    WHERE (journal_submissions.status = 'published' AND (journals.model = 'public' OR journals.model = 'open-public'))
                             ${ userId ? 'OR journal_members.user_id = $1' : '' }
                        
            `
            const params = []
            if ( userId ) {
                params.push(userId)
            }

            const journalResults = await this.core.database.query(sql, params)

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

        // ========  Collect Author Roles for the current user ===========================
      
        if ( userId ) {
            const authorResults = await this.core.database.query(`
                SELECT paper_id, owner FROM paper_authors WHERE user_id = $1
            `, [ userId ])

            if ( authorResults.rows.length > 0 ) {
                authorMap = authorResults.rows.reduce(function(map, row) {
                    if ( ! map[row.paper_id] ) {
                        map[row.paper_id] = row.owner ? [ 'corresponding-authors', 'authors' ] : [ 'authors' ]
                    }
                    return map
                }, {})
            }
        }
            
        // ======== start with public =========================================
        
        let eventConditions = 'paper_events.actor_id = $1 OR paper_events.visibility && $2'
        const params = [ userId, userRoles ]
        let count = 3

        // ======== Paper Roles ===============================================
        // ======== authors, corresponding-authors ============================
       
        for(const [paperId, paperRoles] of Object.entries(authorMap)) {
            const roles = [ ...userRoles, ...paperRoles ]
            eventConditions += ` OR (
                paper_events.paper_id = $${count}
                    AND paper_events.visibility && $${count+1}
                )
            `
            
            count += 2
            params.push(paperId)
            params.push(roles)
        }

        // ======== Submission Roles =========================================================
        // ======== managing-editors, editors, reviewers, assigned-editors, assigned-reviewers 
      
        const permissionsToRoleMap = {
            'owner': 'managing-editors',
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

    /**
     *
    'paper:new-version', 
    'paper:preprint-posted',
    'paper:new-review', 
    'paper:comment-posted',
    'review:comment-reply-posted',
    'submission:new', 
    'submission:new-review',
    'submission:status-changed',
    'submission:reviewer-assigned',
    'submission:reviewer-unassigned',
    'submission:editor-assigned',
    'submission:editor-unassigned'
     */
    async canEditEvent(user, eventId) {
        const eventResults = await this.paperEventDAO.selectEvents('WHERE paper_events.id = $1', [ eventId ])
        if ( ! eventResults.dictionary[eventId] ) {
            return false
        }

        const event = eventResults.dictionary[eventId]

        // Actors can edit their own events.
        if ( event.actorId == user.id ) {
            return true
        }

        // If they are a corresponding author for the paper.
        const paperEvents = [ 
            'paper:new-version', 
            'paper:preprint-posted'
        ]
        if ( paperEvents.includes(event.type) ) {
            const authorResults = await this.core.database.query(`
                SELECT owner FROM paper_authors WHERE paper_authors.paper_id = $1 AND paper_authors.user_id = $2
            `, [ event.paperId, user.id])

            if ( authorResults.rows.length > 0 && authorResults.rows[0].owner) {
                return true
            } 
        }

        // If they are a managing editor or assigned editor for this
        // submission.
        const submissionEvents = [
            'submission:new', 
            'submission:new-review',
            'submission:status-changed',
            'submission:reviewer-assigned',
            'submission:reviewer-unassigned',
            'submission:editor-assigned',
            'submission:editor-unassigned'
        ]
        if ( submissionEvents.includes(event.type) ) {
            const submissionResults = await this.core.database.query(`
                SELECT journal_submissions.journal_id, journal_submission_editors.user_id
                    FROM journal_submissions 
                        LEFT OUTER JOIN journal_submission_editors ON journal_submissions.id = journal_submission_editors.submission_id
                    WHERE journal_submissions.id = $1
            `, [ event.submissionId ])
            if ( submissionResults.rows.length > 0 ) {
                const membership = user.memberships.find((m) => m.journalId == submissionResults.rows[0].journal_id)
                // Managing editor
                if ( membership.permissions == 'owner' ) {
                    return true
                // assigned editor
                } else if ( membership.permissions == 'editor' ) {
                    const userAssigned = submissionResults.rows.find((r) => r.user_id == user.id)
                    if ( userAssigned ) {
                        return true
                    }
                }
            }
        }

        return false 
    }
}
