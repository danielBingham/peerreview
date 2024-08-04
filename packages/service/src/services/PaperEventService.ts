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
import { Core, ServiceError } from '@danielbingham/peerreview-core' 

import { User, Paper, PaperAuthor, PaperEvent, PartialPaperEvent, PaperEventType, PaperEventRootType } from '@danielbingham/peerreview-model'

import { PaperEventDAO } from '../daos/PaperEventDAO'
import { PaperDAO } from '../daos/PaperDAO'

import { SubmissionService, ActiveSubmission } from './SubmissionService'

interface EventVisibility {
    [ event: string ]: string[]
}

interface EventVisibilityByModel {
    [ model: string]: EventVisibility
}

export class PaperEventService { 
    core: Core

    paperEventDAO: PaperEventDAO
    paperDAO: PaperDAO

    submissionService: SubmissionService

    visibilityByModelAndEvent: EventVisibilityByModel

    constructor(core: Core) {
        this.core = core

        this.paperEventDAO = new PaperEventDAO(core)
        this.paperDAO = new PaperDAO(core)

        this.submissionService = new SubmissionService(core)

        this.visibilityByModelAndEvent = {
            'public': {
                'paper:new-version': [ 'public' ],
                'paper:preprint-posted': [ 'public' ],
                'paper:new-review': [ 'public' ], 
                'paper:new-comment': [ 'public' ],
                'review:comment-reply-posted': [ 'public' ],
                'submission:new': [ 'public' ], 
                'submission:new-review': [ 'public' ],
                'submission:new-comment': [ 'public' ],
                'submission:status-changed': [ 'public' ],
                'submission:reviewer-assigned': [ 'public' ],
                'submission:reviewer-unassigned': [ 'public' ],
                'submission:editor-assigned': [ 'public' ],
                'submission:editor-unassigned': [ 'public' ]
            }, 
            'open-public': {
                'paper:new-version': [ 'editors', 'reviewers', 'authors' ],
                'paper:preprint-posted': [ 'public' ],
                'paper:new-review': [ 'editors', 'reviewers', 'authors' ], 
                'paper:new-comment': [ 'editors', 'reviewers', 'authors' ],
                'submission:new': [ 'editors', 'reviewers', 'authors' ], 
                'submission:new-review': [ 'editors', 'reviewers', 'authors' ], 
                'submission:new-comment': [ 'editors', 'reviewers', 'authors' ],
                'submission:status-changed': [ 'editors', 'reviewers', 'authors' ],
                'submission:reviewer-assigned': [ 'editors', 'reviewers', 'authors' ],
                'submission:reviewer-unassigned': [ 'editors', 'reviewers', 'authors' ],
                'submission:editor-assigned': [ 'editors', 'reviewers', 'authors' ],                
                'submission:editor-unassigned': [ 'editors', 'reviewers', 'authors' ]
            }, 
            'open-closed': {
                'paper:new-version': [ 'editors', 'reviewers', 'authors' ],
                'paper:preprint-posted': [ 'public' ],
                'paper:new-review': [ 'editors', 'reviewers', 'authors' ], 
                'paper:new-comment': [ 'editors', 'reviewers', 'authors' ],
                'submission:new': [ 'editors', 'reviewers', 'authors' ], 
                'submission:new-review': [ 'editors', 'reviewers', 'authors' ], 
                'submission:new-comment': [ 'editors', 'reviewers', 'authors' ],
                'submission:status-changed': [ 'editors', 'reviewers', 'authors' ],
                'submission:reviewer-assigned': [ 'editors', 'reviewers', 'authors' ],
                'submission:reviewer-unassigned': [ 'editors', 'reviewers', 'authors' ],
                'submission:editor-assigned': [ 'editors', 'reviewers', 'authors' ],                
                'submission:editor-unassigned': [ 'editors', 'reviewers', 'authors' ]
            },
            'closed': {
                'paper:new-version': [ 'managing-editors', 'assigned-editors', 'assigned-reviewers', 'authors' ],
                'paper:preprint-posted': [ 'public' ],
                'paper:new-review': [ 'authors' ], 
                'paper:new-comment': [ 'authors' ],
                'submission:new': [ 'managing-editors', 'assigned-editors', 'authors' ], 
                'submission:new-review': [ 'managing-editors', 'assigned-editors' ], 
                'submission:new-comment': [ 'managing-editors', 'assigned-editors' ],
                'submission:status-changed': [ 'managing-editors', 'assigned-editors' ],
                'submission:reviewer-assigned': [ 'managing-editors', 'assigned-editors', 'assigned-reviewers' ],
                'submission:reviewer-unassigned': [ 'managing-editors', 'assigned-editors', 'assigned-reviewers' ],
                'submission:editor-assigned': [ 'managing-editors', 'assigned-editors' ],                
                'submission:editor-unassigned': [ 'managing-editors', 'assigned-editors' ]
            }
        }
    }

    // ========================================================================
    // Event Creation
    // ========================================================================

    async getEventVisibility(user: User, event: PaperEvent, paper: Paper, activeSubmissionInfo: ActiveSubmission) {
        let visibility = [ 'authors' ]

        if ( activeSubmissionInfo && this.core.features.hasFeature('journal-permission-models-194') ) {
            const journalResults = await this.core.database.query(`
                SELECT model FROM journals WHERE id = $1
            `, [ activeSubmissionInfo.journalId ])

            if ( journalResults.rows.length <= 0 ) {
                throw new ServiceError('missing-journal', 
                    `Unable to find Journal(${activeSubmissionInfo.journalId}) for Submission(${activeSubmissionInfo.id}).`)
            }

            const journalModel = journalResults.rows[0].model
            visibility = this.visibilityByModelAndEvent[journalModel][event.type]
            if ( ! visibility ) {
                throw new ServiceError('missing-visibility',
                    `model: ${journalModel}, type: ${event.type}, Visibility: ${this.visibilityByModelAndEvent[journalModel][event.type]}`)
            }
        } else if ( paper.showPreprint ) {
            visibility = [ 'public' ]
        }

        return visibility
    }

    async createEvent(user: User, event: PartialPaperEvent) {
        if ( ! ("paperId" in event) || ! event.paperId ) {
            throw new ServiceError('missing-field', `'event.paperId' must be defined.`)
        }

        const activeSubmissionInfo = await this.submissionService.getActiveSubmission(user, event.paperId)
        if ( ! event.submissionId && activeSubmissionInfo ) {
            event.submissionId = activeSubmissionInfo.id
        }

        const paperResults = await this.paperDAO.selectPapers({
            where: 'papers.id = $1', 
            params: [ event.paperId ]
        })
        const paper = paperResults.dictionary[event.paperId]
        if ( ! event.version ) {
            event.version = paper.versions[0].version
        }

        const isAuthor = paper.authors.find((a: PaperAuthor) => a.userId == user.id) ? true : false
        if ( event.type == 'new-review' && isAuthor ) {
            event.type = 'paper:new-review'
            event.visibility = [ 'authors' ]
        } else if ( event.type == 'new-review' && activeSubmissionInfo !== null) {
            event.type = 'submission:new-review'
        } else if ( event.type == 'new-review' && activeSubmissionInfo === null ) {
            event.type = 'paper:new-review'
        }

        if ( event.type == 'new-comment' && isAuthor ) {
            event.type = 'paper:new-comment'
        } else if ( event.type == 'new-comment' && activeSubmissionInfo !== null) {
            event.type = 'submission:new-comment'
        } else if ( event.type == 'new-comment' && activeSubmissionInfo === null ) {
            event.type = 'paper:new-comment'
        }

        if ( ! event.visibility ) {
            event.visibility = await this.getEventVisibility(user, event, paper, activeSubmissionInfo)
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
            
        // ======== start with public and committed =========================================
        
        let eventConditions = `(paper_events.visibility && $1 AND paper_events.status = 'committed')`
        const params = [ userRoles ]
        let count = 2

        if ( userId ) {
            eventConditions += `OR (paper_events.actor_id = $${count})` 
            count += 1
            params.push(userId)
        }

        // ======== Paper Roles ===============================================
        // ======== authors, corresponding-authors ============================
       
        for(const [paperId, paperRoles] of Object.entries(authorMap)) {
            const roles = [ ...userRoles, ...paperRoles ]
            eventConditions += ` OR (
                paper_events.paper_id = $${count}
                    AND paper_events.visibility && $${count+1}
                    AND paper_events.status = 'committed'
                )
            `
            
            count += 2
            params.push(paperId)
            params.push(roles)
        }

        // ======== Submission Roles =========================================================
        // ======== managing-editors, editors, reviewers, assigned-editors, assigned-reviewers 
      
        const permissionsToRoleMap = {
            'owner': [ 'managing-editors', 'editors' ],
            'editor': [ 'editors' ],
            'reviewer': [ 'reviewers' ]
        }
        for(const [submissionId, map] of Object.entries(submissionMap)) {
            const roles = [ ...userRoles ]

            
            roles.push(...permissionsToRoleMap[map.role])

            // TODO: limit visibility of "assigned-editors" and
            // "assigned-reviewers" to the assignee only.
            if ( map.assignedEditor ) {
                roles.push('assigned-editors')
            } 

            eventConditions += ` OR (
                paper_events.visibility && $${count}::paper_event_visibility[] 
                    AND paper_events.submission_id = $${count+1}
                    AND paper_events.status = 'committed'
            )`

            count += 2
            params.push(roles)
            params.push(submissionId)

            if ( map.assignedReviewer ) {
                const assignedRoles = [ ...roles, 'assigned-reviewers' ]

                eventConditions += `OR (
                    paper_events.visibility && $${count}::paper_event_visibility[]
                        AND paper_events.status = 'committed'
                        AND paper_events.submission_id = $${count+1}
                        AND (
                            ( paper_events.actor_id = $${count+2} OR paper_events.assignee_id = $${count+2} )
                            OR paper_events.type = 'paper:new-version'
                        )
                    )
                `
                count += 3
                params.push(assignedRoles)
                params.push(submissionId)
                params.push(userId)
            }
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

    async canViewAnonymous(user, eventIds) {
        /*const results = await this.database.query(`
            SELECT paper_events.id
                FROM paper_events
                    LEFT OUTER JOIN paper_authors ON paper_authors.paper_id = paper_events.paper_id
                    LEFT OUTER JOIN  ` */

        // If the user is the event actor, then they can see.
        

        // If the user is an Author and the actor is an Author, then they can see.


        // If user is a Managing Editor or an Assigned Editor and actor is a journal member, they can see it.


    }
}
