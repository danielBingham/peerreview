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
import path from 'path'

import { Core, ServiceError } from '@danielbingham/peerreview-core' 
import { User, PaperEventVisibility, NotificationType } from '@danielbingham/peerreview-model'

import { NotificationDAO } from '../../daos/NotificationDAO'
import { PaperEventDAO } from '../../daos/PaperEventDAO'
import { PaperDAO } from '../../daos/PaperDAO'

import { EmailService } from '../EmailService'
import { SubmissionService } from '../SubmissionService'
import { PaperEventService } from '../PaperEventService'

import { NotificationDefinition } from './NotificationDefinition'
import { NotificationContext } from './NotificationContext'


export { NotificationContext } from './NotificationContext'
export class NotificationService {
    core: Core

    notificationDAO: NotificationDAO
    paperEventDAO: PaperEventDAO
    paperDAO: PaperDAO

    emailService: EmailService
    submissionService: SubmissionService
    paperEventService: PaperEventService

    notificationMap: { [type: string]: (currentUser: User, context: NotificationContext) => Promise<void> }

    constructor(core: Core) {
        this.core = core

        this.notificationDAO = new NotificationDAO(core)
        this.paperEventDAO = new PaperEventDAO(core)
        this.paperDAO = new PaperDAO(core)

        this.emailService = new EmailService(core)
        this.submissionService = new SubmissionService(core)
        this.paperEventService = new PaperEventService(core)

        this.notificationMap = {
            // Notifications that affect multiple objects.
            'new-review': this.sendNewReview.bind(this),
            'new-version': this.sendNewVersion.bind(this),
            'new-comment': this.sendNewComment.bind(this),

            // Paper notifications.
            'paper:submitted': this.sendPaperSubmitted.bind(this),
            'paper:preprint-posted': this.sendPaperPreprintPosted.bind(this),
            'paper:review-comment-reply': this.sendPaperReviewCommentReply.bind(this),

            // Journal notifications.
            'journal:invited': this.sendJournalInvited.bind(this),
            'journal:role-changed': this.sendJournalRoleChanged.bind(this),
            'journal:removed': this.sendJournalRemoved.bind(this),

            // Submission notifications.
            'submission:new': this.sendSubmissionNew.bind(this),
            'submission:review-comment-reply': this.sendSubmissionReviewCommentReply.bind(this),
            'submission:status-changed': this.sendSubmissionStatusChanged.bind(this),
            'submission:reviewer-assigned': this.sendSubmissionReviewerAssigned.bind(this),
            'submission:reviewer-unassigned': this.sendSubmissionReviewerUnassigned.bind(this),
            'submission:editor-assigned': this.sendSubmissionEditorAssigned.bind(this),
            'submission:editor-unassigned': this.sendSubmissionEditorUnassigned.bind(this)
        }
    }

    async sendNewReview(currentUser: User, context: NotificationContext): Promise<void> {
        let object = 'paper'

        if ( ! context.review ) {
            throw new ServiceError('missing-context',
                                   `Notification context missing property "review".`)
        }

        const paperResults = await this.paperDAO.selectPapers({ 
            where: 'papers.id = $1', 
            params: [ context.review.paperId ]
        })
        const paper = paperResults.dictionary[context.review.paperId]

        const eventResults = await this.paperEventDAO.selectEvents({ 
            where: `paper_events.review_id = $1`, 
            params: [ context.review.id ]
        })
        if ( eventResults.list.length <= 0 ) {
            throw new ServiceError('missing-event', 
                `Event missing for Review(${context.review.id}).`)
        }
        const event = eventResults.dictionary[eventResults.list[0]]

        // There will only be activeSubmissionInfo if the currentUser (who is
        // also the review submitter) is associated with submission through its
        // journal or is an author.  Otherwise, this will be `null` indicating
        // that this is a preprint review.
        //
        // TODO If authors are giving reviews to a closed journal and we count
        // that as part of the submission... they'll lose visibility into their
        // own review.  We need to think about how to handle author reviews in
        // this context - maybe default is author only visibility.
        const activeSubmissionInfo = await this.submissionService.getActiveSubmission(currentUser, paper.id)
        if ( activeSubmissionInfo ) {
            object = 'submission'
            
            // ==== Editors ===================================================
            
            if ( event.visibility.includes(PaperEventVisibility.Editors) 
                || event.visibility.includes(PaperEventVisibility.AssignedEditors) 
               ) {
                const assignedEditorResults = await this.core.database.query(`
                    SELECT user_id FROM journal_submission_editors WHERE submission_id = $1
                `, [ activeSubmissionInfo.id ])

                for(const row of assignedEditorResults.rows) {
                    if ( row.user_id == currentUser.id ) {
                        continue
                    }

                    await this.createNotification(
                        row.user_id,
                        `editor:${object}:new-review` as NotificationType,
                        {
                            paper: paper,
                            review: context.review,
                            reviewerUser: currentUser
                        }
                    )
                }
            }
        }

        // ======== Authors ===================================================

        if ( event.visibility.includes(PaperEventVisibility.Public) || event.visibility.includes(PaperEventVisibility.Authors) ) {
            for(const author of paper.authors) {
                if ( author.userId == currentUser.id ) {
                    continue
                }

                await this.createNotification(
                    author.userId,
                    `author:${object}:new-review` as NotificationType,
                    {
                        paper: paper,
                        review: context.review,
                        reviewerUser: currentUser 
                    }
                )
            }
        } else if ( event.visibility.includes(PaperEventVisibility.CorrespondingAuthors) ) {
            for(const author of paper.authors) {
                if ( author.userId == currentUser.id ) {
                    continue
                }
                if ( ! author.owner ) {
                    continue
                }

                await this.createNotification(
                    author.userId,
                    `author:${object}:new-review` as NotificationType,
                    {
                        paper: paper,
                        review: context.review,
                        reviewerUser: currentUser 
                    }
                )
            }
        }
    }

    async sendNewComment(currentUser: User, context: NotificationContext): Promise<void> {
        let object = 'paper'
        const notifiedUserIds = [ currentUser.id ]

        if ( ! context.comment ) {
            throw new ServiceError('missing-context',
                                   "Missing required context 'comment'.")
        }

        const paperResults = await this.paperDAO.selectPapers({ 
            where: 'papers.id = $1', 
            params: [ context.comment.paperId ]
        })
        const paper = paperResults.dictionary[context.comment.paperId]

        const eventResults = await this.paperEventDAO.selectEvents({ 
            where: `paper_events.paper_comment_id = $1`, 
            params: [ context.comment.id ]
        })
        if ( eventResults.list.length <= 0 ) {
            throw new ServiceError('missing-event', 
                `Event missing for Review(${context.comment.id}).`)
        }
        const event = eventResults.dictionary[eventResults.list[0]]

        // There will only be activeSubmissionInfo if the currentUser (who is
        // also the comment submitter) is associated with submission through its
        // journal or is an author.  Otherwise, this will be `null` indicating
        // that this is a preprint comment.
        const activeSubmissionInfo = await this.submissionService.getActiveSubmission(currentUser, paper.id)
        if ( activeSubmissionInfo ) {
            object = 'submission'

            // ==== Assigned Reviewers ========================================

            const isVisibleToAssignedReviewers = event.visibility.includes(PaperEventVisibility.AssignedReviewers) 
                || event.visibility.includes(PaperEventVisibility.Reviewers) || event.visibility.includes(PaperEventVisibility.Public)

            if ( isVisibleToAssignedReviewers ) {
                const assignedReviewerResults = await this.core.database.query(`
                    SELECT journal_submission_reviewers.user_id 
                        FROM journal_submission_reviewers 
                        WHERE journal_submission_reviewers.submission_id = $1
                `, [ activeSubmissionInfo.id ])

                const assignedReviewerIds = assignedReviewerResults.rows.length > 0 ? assignedReviewerResults.rows.map((r) => r.user_id) : []
                for ( const id of assignedReviewerIds) {  
                    if ( notifiedUserIds.includes(id)) {
                        continue
                    }

                    notifiedUserIds.push(id)
                    await this.createNotification(
                        id,
                        `reviewer:${object}:new-comment` as NotificationType,
                        {
                            paper: paper,
                            comment: context.comment,
                            user: currentUser
                        }
                    )
                }
            }
            
            // ==== Editors ===================================================
            
            if ( event.visibility.includes(PaperEventVisibility.Editors) || event.visibility.includes(PaperEventVisibility.AssignedEditors) ) {
                const assignedEditorResults = await this.core.database.query(`
                    SELECT user_id FROM journal_submission_editors WHERE submission_id = $1
                `, [ activeSubmissionInfo.id ])

                for(const row of assignedEditorResults.rows) {
                    if ( notifiedUserIds.includes(row.user_id)) {
                        continue
                    }

                    notifiedUserIds.push(row.user_id)
                    await this.createNotification(
                        row.user_id,
                        `editor:${object}:new-comment` as NotificationType,
                        {
                            paper: paper,
                            comment: context.comment,
                            user: currentUser
                        }
                    )
                }
            }
        }

        // ======== Authors ===================================================

        if ( event.visibility.includes(PaperEventVisibility.Public) || event.visibility.includes(PaperEventVisibility.Authors) ) {
            for(const author of paper.authors) {
                if ( notifiedUserIds.includes(author.userId)) {
                    continue
                }

                notifiedUserIds.push(author.userId)
                await this.createNotification(
                    author.userId,
                    `author:${object}:new-comment` as NotificationType,
                    {
                        paper: paper,
                        comment: context.comment,
                        user: currentUser
                    }
                )
            }
        } else if ( event.visibility.includes(PaperEventVisibility.CorrespondingAuthors) ) {
            for(const author of paper.authors) {
                if ( notifiedUserIds.includes(author.userId)) {
                    continue
                }
                if ( ! author.owner ) {
                    continue
                }

                notifiedUserIds.push(author.userId)
                await this.createNotification(
                    author.userId,
                    `author:${object}:new-comment` as NotificationType,
                    {
                        paper: paper,
                        comment: context.comment,
                        user: currentUser
                    }
                )
            }
        }
        // TODO reviewers who have left a pre-print review
    }

    async sendNewVersion(currentUser: User, context: NotificationContext): Promise<void> {
        if ( ! context.paper ) {
            throw new ServiceError('missing-context', 'Paper missing from context in sendNewVersion.')
        }
        if ( ! context.submission ) {
            throw new ServiceError('missing-context', 'JournalSubmission missing from context.')
        }

        const eventResults = await this.paperEventDAO.selectEvents({
            where: `paper_events.type = 'paper:new-version' AND paper_events.paper_id = $1 AND paper_events.version = $2`,
            params: [ context.paper.id, context.paper.versions[0].version ]
        })
        if ( eventResults.list.length <= 0 ) {
            throw new ServiceError('missing-event', 
                `Missing submission event for Submission(${context.submission.id}).`)
        }
        const event = eventResults.dictionary[eventResults.list[0]]

        // There will only be activeSubmissionInfo if the currentUser (who is
        // also the review submitter) is associated with submission through its
        // journal or is an author.  Otherwise, this will be `null` indicating
        // that this is a preprint review.
        //
        // TODO If authors are giving reviews to a closed journal and we count
        // that as part of the submission... they'll lose visibility into their
        // own review.  We need to think about how to handle author reviews in
        // this context - maybe default is author only visibility.
        const activeSubmissionInfo = await this.submissionService.getActiveSubmission(currentUser, context.paper.id)

        // ======== Authors ===================================================

        const isVisibleToAuthors = event.visibility.includes(PaperEventVisibility.Authors) || event.visibility.includes(PaperEventVisibility.Public)
        const isVisibleToCorrespondingAuthors = event.visibility.includes(PaperEventVisibility.CorrespondingAuthors) 
            || event.visibility.includes(PaperEventVisibility.Authors) || event.visibility.includes(PaperEventVisibility.Public)

        if ( isVisibleToAuthors || isVisibleToCorrespondingAuthors ) {
            for ( const author of context.paper.authors) {
                if ( author.userId == currentUser.id ) {
                    continue
                }
                if ( ! author.owner && ! isVisibleToAuthors ) {
                    continue
                }

                await this.createNotification(
                    author.userId,
                    NotificationType.Author_Paper_NewVersion,
                    {
                        correspondingAuthor: currentUser,
                        paper: context.paper 
                    }
                )
            }
        }

        let assignedReviewerIds: number[] = []
        let assignedEditorIds: number[] = []
        if ( activeSubmissionInfo ) {
            // ==== Assigned Reviewers ========================================

            const isVisibleToAssignedReviewers = event.visibility.includes(PaperEventVisibility.AssignedReviewers) 
                || event.visibility.includes(PaperEventVisibility.Reviewers) || event.visibility.includes(PaperEventVisibility.Public)

            if ( isVisibleToAssignedReviewers ) {
                const assignedReviewerResults = await this.core.database.query(`
                    SELECT journal_submission_reviewers.user_id 
                        FROM journal_submission_reviewers 
                        WHERE journal_submission_reviewers.submission_id = $1
                `, [ activeSubmissionInfo.id ])

                assignedReviewerIds = assignedReviewerResults.rows.length > 0 ? assignedReviewerResults.rows.map((r) => r.user_id) : []
                for ( const id of assignedReviewerIds) {  
                    if ( id == currentUser.id ) {
                        continue
                    }

                    await this.createNotification(
                        id,
                        NotificationType.Reviewer_Submission_NewVersion,
                        {
                            correspondingAuthor: currentUser, 
                            paper: context.paper 
                        }
                    )
                }
            }

          
            // ==== Assigned Editors ==========================================
            
            const isVisibleToAssignedEditors = event.visibility.includes(PaperEventVisibility.AssignedEditors)
                || event.visibility.includes(PaperEventVisibility.Editors) || event.visibility.includes(PaperEventVisibility.Public)
            if ( isVisibleToAssignedEditors ) {
                const assignedEditorResults = await this.core.database.query(`
                    SELECT user_id FROM journal_submission_editors
                        LEFT OUTER JOIN journal_submissions ON journal_submission_editors.submission_id = journal_submissions.id
                    WHERE journal_submissions.paper_id = $1
                `, [ context.paper.id ])

                assignedEditorIds = assignedEditorResults.rows.length > 0 ? assignedEditorResults.rows.map((r) => r.user_id) : []
                assignedEditorIds = assignedEditorIds.filter((id) => ! assignedReviewerIds.includes(id) && id !== currentUser.id)

                for ( const id of assignedEditorIds) {  
                    await this.createNotification(
                        id,
                        NotificationType.Editor_Submission_NewVersion,
                        {
                            correspondingAuthor: currentUser,
                            paper: context.paper 
                        }
                    )
                }
            }
        }

        // ======== Preprint Reviewers ========================================
        
        if ( event.visibility.includes(PaperEventVisibility.Public) ) {
            // TODO Figure out where preprint reviewers fit in all this.
            //
            // Reviewers who reviewed a preprint
            const reviewerResults = await this.core.database.query(`
                SELECT user_id FROM reviews WHERE paper_id = $1
            `, [ context.paper.id ])

            // O(n^2) Okay here, because this will rarely even reach n=100.  Most
            // of the time n will be single digit.
            let reviewerIds = reviewerResults.rows.length > 0 ? reviewerResults.rows.map((r) => r.user_id) : []
            reviewerIds = reviewerIds.filter((id) => ! assignedReviewerIds.includes(id) && id !== currentUser.id)

            for(const id of reviewerIds) {
                await this.createNotification(
                    id,
                    NotificationType.Reviewer_Paper_NewVersion,
                    {
                        correspondingAuthor: currentUser,
                        paper: context.paper
                    }
                )
            }
        }
    }
    
    async sendPaperSubmitted(currentUser: User, context: NotificationContext): Promise<void> {
        if ( ! context.paper ) {
            throw new ServiceError('missing-context',
                                   'Paper missing from NotificationContext.')
        }

        // authors 
        for ( const author of context.paper.authors) {
            if ( author.userId == currentUser.id ) {
                continue
            }

            await this.createNotification(
                author.userId,
                NotificationType.Author_Paper_Submitted,
                {
                    correspondingAuthor: currentUser,
                    paper: context.paper
                }
            )
        }
    }

    async sendPaperPreprintPosted(
        currentUser: User, 
        context: NotificationContext
    ): Promise<void> {
        if ( ! context.paper ) {
            throw new ServiceError('missing-context',
                                   'Paper missing from NotificationContext.')
        }

        for(const author of context.paper.authors) {
            if ( author.userId == currentUser.id ) {
                continue
            }

            await this.createNotification(
                author.userId,
                NotificationType.Author_Paper_PreprintPosted,
                {
                    correspondingAuthor: currentUser,
                    paper: context.paper 
                }
            )
        }
    }

    async sendPaperReviewCommentReply(
        currentUser: User, 
        context: NotificationContext
    ): Promise<void> {
        throw new ServiceError('not-implemented', `Not yet implemented.`)
    }

    async sendJournalInvited(currentUser: User, context: NotificationContext): Promise<void> {
        if ( ! context.member ) { 
            throw new ServiceError('missing-context',
                                   'JournalMember missing from context.')
        }

        // Don't notify the user of their own actions.
        if ( currentUser.id == context.member.userId ) {
            return
        }

        await this.createNotification(
            context.member.userId,
            NotificationType.JournalMember_Journal_Invited,
            {
                user: currentUser,
                journal: context.journal 
            }
        )
    }

    async sendJournalRoleChanged(currentUser: User, context: NotificationContext): Promise<void> {
        throw new ServiceError('not-implemented', 'Not yet implemented.')
    }

    async sendJournalRemoved(currentUser: User, context: NotificationContext): Promise<void> {
        throw new ServiceError('not-implemented', 'Not yet implemented.')
    }

    async sendSubmissionNew(currentUser: User, context: NotificationContext): Promise<void> {
        if ( ! context.submission ) {
            throw new ServiceError('missing-context', 'Missing JournalSubmission from context.')
        }
        if ( ! context.paperId ) {
            throw new ServiceError('missing-context', 'Missing paperId from context.')
        }
        if ( ! context.journal ) {
            throw new ServiceError('missing-context', 'Journal missing from context.')
        }

        const eventResults = await this.paperEventDAO.selectEvents({
            where: `paper_events.type='submission:new' AND paper_events.submission_id = $1`,
            params: [ context.submission.id ]
        })
        if ( eventResults.list.length <= 0 ) {
            throw new ServiceError('missing-event', 
                `Missing submission event for Submission(${context.submission.id}).`)
        }
        const event = eventResults.dictionary[eventResults.list[0]]

        const paperResults = await this.paperDAO.selectPapers({
            where: 'papers.id = $1', 
            params: [ context.paperId ]
        })
        if ( paperResults.list.length <= 0 ) {
            throw new ServiceError('missing-paper',
                `Missing Paper(${context.paperId}).`)
        }
        const paper = paperResults.dictionary[context.paperId]

        // ======== Authors ===================================================
       
        let notifiedAuthors = []
        if ( event.visibility.includes(PaperEventVisibility.Authors) || event.visibility.includes(PaperEventVisibility.Public) ) {
            for(const author of paper.authors) {
                if ( author.userId == currentUser.id) {
                    continue
                }

                notifiedAuthors.push(author.userId)
                await this.createNotification(
                    author.userId,
                    NotificationType.Author_Submission_New,
                    {
                        correspondingAuthor: currentUser,
                        paper: context.paper,
                        journal: context.journal
                    }
                )
            }
        }

        // ======== Editors ===================================================

        const visibleToEditors = event.visibility.includes(PaperEventVisibility.Editors) || event.visibility.includes(PaperEventVisibility.Public)
        const visibleToManagingEditors = event.visibility.includes(PaperEventVisibility.ManagingEditors) 
            || event.visibility.includes(PaperEventVisibility.Editors) || event.visibility.includes(PaperEventVisibility.Public)
        
        for(const member of context.journal.members) {
            if ( member.userId == currentUser.id ) {
                continue
            }
            if ( member.permissions == 'editor' && ! visibleToEditors ) {
                continue
            }
            if ( member.permissions == 'owner' && ! visibleToManagingEditors ) {
                continue
            }
            if ( member.permissions == 'reviewer') {
                continue
            }
            if ( notifiedAuthors.includes(member.userId)) {
                continue
            }

            await this.createNotification(
                member.userId,
                NotificationType.Editor_Submission_New,
                {
                    correspondingAuthor: currentUser,
                    paper: paper,
                    journal: context.journal
                }
            )
        }
    }

    async sendSubmissionReviewCommentReply(currentUser: User, context: NotificationContext): Promise<void> {
        throw new ServiceError('not-implemented', 'Not yet implemented.')
    }

    async sendSubmissionStatusChanged(currentUser: User, context: NotificationContext): Promise<void> {
        throw new ServiceError('not-implemented', 'Not yet implemented.')

    }

    async sendSubmissionReviewerAssigned(
        currentUser: User, 
        context: NotificationContext
    ): Promise<void> {
        if ( ! context.reviewer ) {
            throw new ServiceError('missing-context',
                                   'Reviewer missing from context.')
        }

        if ( ! context.paperId ) {
            throw new ServiceError('missing-context',
                                   'PaperId missing from context.')
        }

        if ( ! context.journal ) {
            throw new ServiceError('missing-context',
                                   'Journal missing from context.')
        }
            

        if ( currentUser.id == context.reviewer.userId ) {
            return
        }


        const paperResults = await this.core.database.query(`
            SELECT papers.title FROM papers WHERE papers.id = $1
        `, [ context.paperId ])
        const title = paperResults.rows[0].title

        // reviewer 
        await this.createNotification(
            context.reviewer.userId,
            NotificationType.Reviewer_Submission_ReviewerAssigned,
            {
                editorUser: currentUser,
                partialPaper: {
                    id: context.paperId,
                    title: title
                },
                journal: context.journal
            }
        )
    }

    async sendSubmissionReviewerUnassigned(currentUser: User, context: NotificationContext): Promise<void> {
        if ( currentUser.id == context.reviewerId ) {
            return
        }

        if ( ! ('reviewerId' in context) || ! context.reviewerId) {
            throw new ServiceError('missing-context', `Field 'reviewerId' missing from context.`)
        }

        if ( ! ('paperId' in context) || ! context.paperId ) {
            throw new ServiceError('missing-context', `Field 'paperId' missing from context.`)
        }


        const notificationResults = await this.core.database.query(`
            SELECT papers.title FROM papers WHERE papers.id = $1
        `, [ context.paperId ])
        const title = notificationResults.rows[0].title

        await this.createNotification(
            context.reviewerId,
            NotificationType.Reviewer_Submission_ReviewerUnassigned,
            {
                editorUser: currentUser,
                partialPaper: {
                    id: context.paperId,
                    title: title
                },
                journal: context.journal

            }
        )
    }

    async sendSubmissionEditorAssigned(currentUser: User, context: NotificationContext): Promise<void> {
        if ( ! ("editor" in context) || ! context.editor ) {
            throw new ServiceError('missing-context', `Field 'editor' missing from context.`)
        }

        if ( currentUser.id == context.editor.userId ) {
            return
        }


        const notificationResults = await this.core.database.query(`
            SELECT papers.title FROM papers WHERE papers.id = $1
        `, [ context.paperId ])
        const title = notificationResults.rows[0].title

        await this.createNotification(
            context.editor.userId,
            NotificationType.Editor_Submission_EditorAssigned,
            {
                editorUser: currentUser,
                partialPaper: {
                    id: context.paperId,
                    title: title
                },
                journal: context.journal
            }

        )
    }

    async sendSubmissionEditorUnassigned(currentUser: User, context: NotificationContext): Promise<void> {
        if ( ! ("editorId" in context) || ! context.editorId ) {
            throw new ServiceError('missing-context', `Field 'editorId' missing from context.`)
        }

        if ( currentUser.id == context.editorId ) {
            return
        }

        const notificationResults = await this.core.database.query(`
            SELECT papers.title FROM papers WHERE papers.id = $1
        `, [ context.paperId ])
        const title = notificationResults.rows[0].title

        await this.createNotification(
            context.editorId,
            NotificationType.Editor_Submission_EditorUnassigned,
            {
                editorUser: currentUser,
                partialPaper: {
                    id: context.paperId,
                    title: title
                },
                journal: context.journal
            }
        )

    }

    /**
     * Send notifications for the given `type` and `context` triggered by
     * `currentUser`.
     */
    async sendNotifications(
        currentUser: User, 
        type: NotificationType, 
        context: NotificationContext
    ): Promise<void> {
        return await this.notificationMap[type](currentUser, context)
    }

    /**
     * Get the definition of a notification for `type`.
     */
    async getDefinition(type: NotificationType): Promise<NotificationDefinition> {
        const pathParts = type.split(':')
        const definitionPath = path.join('./notifications', ...pathParts)
        const definition = await import(definitionPath)
        return definition
    }

    /**
     * Create a notification and send notification emails.  Different notifications
     * require different context.  See definitions above for the contexts requried
     * by each notification type.
     *
     * @param   {int}   userId  The `user.id` of the User we want to send the
     * notification to.
     * @param   {string}    type    The type of notification we want to send.
     * @see `notificationDefinitions`
     * @param   {Object}    context The contextual information necessary to
     * generate the notification content.  Differs per notification.type.  @see
     * `notificationDefinitions` for definition.
     * 
     */
    async createNotification(
        userId: number, 
        type: NotificationType, 
        context: NotificationContext
    ): Promise<void> {
        const definition = await this.getDefinition(type)
        if ( ! definition ) {
            throw new ServiceError('missing-definition',
                `Failed to find notification definitions for type '${type}'.`)
        }
        
        context.host = this.core.config.host

        const notification = {
            userId: userId,
            type: type,
            description: definition.text(context),
            path: definition.path(context) 
        }
        await this.notificationDAO.insertNotification(notification)

        
        const results = await this.core.database.query(`
            SELECT email FROM users WHERE id = $1
        `, [ userId ])

        const email = results.rows[0].email

        await this.emailService.sendNotificationEmail(
            email, 
            definition.email.subject(context), 
            definition.email.body(context)
        )
    }
}
