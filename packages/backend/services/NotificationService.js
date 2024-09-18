
const Handlebars = require('handlebars')

const NotificationDAO = require('../daos/NotificationDAO')
const PaperEventDAO = require('../daos/PaperEventDAO')
const PaperDAO = require('../daos/PaperDAO')

const EmailService = require('./EmailService')
const SubmissionService = require('./SubmissionService')
const PaperEventService = require('./PaperEventService')

const ServiceError = require('../errors/ServiceError')


module.exports = class NotificationService {


    constructor(core) {
        this.core = core

        this.notificationDAO = new NotificationDAO(core)
        this.paperEventDAO = new PaperEventDAO(core)
        this.paperDAO = new PaperDAO(core)

        this.emailService = new EmailService(core)
        this.submissionService = new SubmissionService(core)
        this.paperEventService = new PaperEventService(core)

        this.notificationDefinitions = {
            
            /* ============ Paper Notifications ======================================= */
            /* User was added to a paper as an author. */
            'author:paper:submitted': {
                email: {
                    subject: Handlebars.compile('[JournalHub] Your co-author, {{correspondingAuthor.name}}, submitted "{{paper.title}}"'), 
                    body: Handlebars.compile(`
                        Your co-author, {{correspondingAuthor.name}}, submitted "{{paper.title}}" on which you are listed as a co-author to JournalHub.  You can find the paper, collaborate with your co-authors, solicit preprint review, submit to journals, communicate with your reviewers and more on JournalHub.

                        You can find the paper here: {{host}}paper/{{paper.id}}/file
                        `)
                },
                text: Handlebars.compile(`Your co-author, {{correspondingAuthor.name}}, submittted paper "{{paper.title}}".`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`) 
            },

            /* 
             * A new version was uploaded for a paper the user is an author, editor, or
             * reviewer on. 
             */
            'author:paper:new-version': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{correspondingAuthor.name}} uploaded a new version of "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    Your co-author, {{correspondingAuthor.name}} uploaded a new version of "{{paper.title}}".

                    You can go here to view the version: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of {{paper.title}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            }, 
            'reviewer:paper:new-version': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{correspondingAuthor.name}} uploaded a new version of "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{correspondingAuthor.name}} uploaded a new version of "{{paper.title}}" which you previously reviewed.

                    You can go here to view the version: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of {{paper.title}}, which you previously reviewed.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            }, 

            /**
             * A paper the user is an author of was submitted as a preprint.
             */
            'author:paper:preprint-posted': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{correspondingAuthor.name}} submitted a preprint of "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    Your co-author, {{correspondingAuthor.name}} submitted a preprint of "{{paper.title}}".

                    You can go here to view the preprint: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} submitted a preprint of "{{paper.title}}".`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },

            /**
             * A review was posted to a paper that the user is an author or editor of.
             */
            'author:paper:new-review': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] A new review of "{{paper.title}}" has been posted`),
                    body: Handlebars.compile(`
                    A new review of "{{paper.title}}" has been posted. 

                    Read the review: {{host}}paper/{{paper.id}}/timeline#review-{{review.id}}
                    `)
                },
                text: Handlebars.compile(`A new review of "{{paper.title}}" has been posted`),
                path: Handlebars.compile(`/paper/{{paper.id}}/timeline#review-{{review.id}}`)
            },

            /**
             * A reply was posted to a comment thread the user is participating in. TODO
             */
            'author:paper:review-comment-reply': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },
            'reviewer:paper:review-comment-reply': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },

            /**
             * A comment was posted to the timeline of a paper the user is an author,
             * reviewer, or editor for. TODO
             */
            'author:paper:new-comment': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{user.name}} commented on your paper, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                     {{user.name}} commented on your paper, "{{paper.title}}". 

                    Read the comment: {{host}}paper/{{paper.id}}/timeline#comment-{{comment.id}}
                    `)
                },
                text: Handlebars.compile(`{{user.name}} commented on your paper, "{{paper.title}}"`),
                path: Handlebars.compile(`/paper/{{paper.id}}/timeline#comment-{{comment.id}}`)
            },
            'reviewer:paper:new-comment': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{user.name}} commented on "{{paper.title}}", which you reviewed`),
                    body: Handlebars.compile(`
                    {{user.name}} commented on "{{paper.title}}", which you reviewed. 

                    Read the comment: {{host}}paper/{{paper.id}}/timeline#comment-{{comment.id}}

                        `)
                },
                text: Handlebars.compile(`{{user.name}} commented on "{{paper.title}}", which you reviewed`),
                path: Handlebars.compile(`/paper/{{paper.id}}/timeline#comment-{{comment.id}}`)
            },

            /* ============ Journal Notifications ===================================== */
            
            /**
             * User has been added to a journal's team.
             */
            'journal-member:journal:invited': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{user.name}} invited you to join {{journal.name}}`),
                    body: Handlebars.compile(`
                    You have been invited by {{user.name}} to join {{journal.name}}.

                    View the journal here: {{host}}journal/{{journal.id}}
                    `)
                },
                text: Handlebars.compile(`{{user.name}} invited you to join {{journal.name}}`),
                path: Handlebars.compile(`/journal/{{journal.id}}`)
            },

            /**
             * Role in journal changed. TODO
             */
            'journal-member:journal:role-changed': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{user.name}} changed your role for {{journal.name}} to {{role}}`),
                    body: Handlebars.compile(`
                    Your co-author, {{correspondingAuthor.name}} submitted a preprint of "{{paper.title}}".

                    You can go here to view the preprint: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{user.name}} changed your role for {{journal.name}} to {{role}}`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },

            /**
             * User removed from journal's team. TODO
             */
            'journal-member:journal:removed': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{user.name}} removed you from {{journal.name}}`),
                    body: Handlebars.compile(`
                    You have been removed from the membership of {{journal.name}}.
                    `)
                },
                text: Handlebars.compile(`{{user.name}} removed you from {{journal.name}}`),
                path: Handlebars.compile(`/journal/{{journal.id}}`)
            },

            /* ============ Submission Notifications ================================== */

            /**
             * A paper the user is an author of was submitted to a journal.
             * A journal the user is a managing editor of received a new submission.
             */
            'author:submission:new': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] Your co-author, {{correspondingAuthor.name}}, submitted "{{paper.title}}" to {{journal.name}}`),
                    body: Handlebars.compile(`
                    Your co-author, {{correspondingAuthor.name}}, submitted "{{paper.title}}" to {{journal.name}}.

                    You can go here to view the submission: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} submitted "{{paper.title}}" to {{journal.name}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            }, 
            'editor:submission:new': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{correspondingAuthor.name}} submitted "{{paper.title}}" to {{journal.name}}`),
                    body: Handlebars.compile(`
                    {{correspondingAuthor.name}} submitted "{{paper.title}}" to {{journal.name}}.

                    You can go here to view the submission: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} submitted "{{paper.title}}" to {{journal.name}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },

            /**
             * A new version of a paper associated with a submission has been submitted.
             */
            'author:submission:new-version': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{correspondingAuthor.name}} uploaded a new version of your paper, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{correspondingAuthor.name}} uploaded a new version of your "{{paper.title}}".

                    You can go here to view the version: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of your paper, {{paper.title}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },
            'reviewer:submission:new-version': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{correspondingAuthor.name}} uploaded a new version of you review assignment, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{correspondingAuthor.name}} uploaded a new version of "{{paper.title}}", which you are assigned to review.

                    You can go here to view the version: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of your review assignment, {{paper.title}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },
            'editor:submission:new-version': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{correspondingAuthor.name}} uploaded a new version of your editorial assignment, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{correspondingAuthor.name}} uploaded a new version of your editoral assignment, "{{paper.title}}".

                    You can go here to view the version: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of your editorial assignment, "{{paper.title}}".`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },

            /**
             * A new review has been submitted for a submission.
             */
            'author:submission:new-review': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{reviewer.name}} posted a new review of your paper, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{reviewer.name}} posted a new review of "{{paper.title}}".

                    Read the review: {{host}}paper/{{paper.id}}/timeline#review-{{review.id}}
                    `)
                },
                text: Handlebars.compile(`{{reviewer.name}} posted a new review of your paper, "{{paper.title}}"`),
                path: Handlebars.compile(`/paper/{{paper.id}}/timeline#review-{{review.id}}`)
            },
            'editor:submission:new-review': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{reviewer.name}} posted a new review of your editorial assignment, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{reviewer.name}} posted a new review of "{{paper.title}}", which you are assigned to edit.

                    Read the review: {{host}}paper/{{paper.id}}/timeline#review-{{review.id}}
                    `)
                },
                text: Handlebars.compile(`{{reviewer.name}} posted a new review of your editorial assignment, "{{paper.title}}"`),
                path: Handlebars.compile(`/paper/{{paper.id}}/timeline#review-{{review.id}}`)
            },

            /**
             * Submission Review Comment Reply TODO
             */
            'author:submission:review-comment-reply': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },
            'reviewer:submission:review-comment-reply': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },
            'editor:submission:review-comment-reply': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },

            /**
             * Submission New Comment TODO
             */
            'author:submission:new-comment': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{user.name}} commented on your paper, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{user.name}} commented on your paper, "{{paper.title}}". 

                    Read the comment: {{host}}paper/{{paper.id}}/timeline#comment-{{comment.id}}
                    `)
                },
                text: Handlebars.compile(`{{user.name}} commented on your paper, "{{paper.title}}"`),
                path: Handlebars.compile(`/paper/{{paper.id}}/timeline#comment-{{comment.id}}`)
            },
            'reviewer:submission:new-comment': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{user.name}} commented on your review assignment, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{user.name}} commented on your review assignment, "{{paper.title}}". 

                    Read the comment: {{host}}paper/{{paper.id}}/timeline#comment-{{comment.id}}
                    `)
                },
                text: Handlebars.compile(`{{user.name}} commented on your review assignment, "{{paper.title}}"`),
                path: Handlebars.compile(`/paper/{{paper.id}}/timeline#comment-{{comment.id}}`)
            },
            'editor:submission:new-comment': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{user.name}} commented on "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{user.name}} commented on "{{paper.title}}". 

                    Read the comment: {{host}}paper/{{paper.id}}/timeline#comment-{{comment.id}}
                    `)
                },
                text: Handlebars.compile(`{{user.name}} commented on "{{paper.title}}"`),
                path: Handlebars.compile(`/paper/{{paper.id}}/timeline#comment-{{comment.id}}`)
            },

            /**
             * The status of a submission the user is an author of changed.
             */
            'author:submission:status-changed': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },
            'editor:submission:status-changed': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },

            /**
             * A user was (un)assigned as a reviewer to a paper. 
             */
            'reviewer:submission:reviewer-assigned': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{editor.name}} assigned you to review "{{paper.title}}" for {{journal.name}}.`),
                    body: Handlebars.compile(`
                    {{editor.name}} assigned you to review "{{paper.title}}" for {{journal.name}}.

                    You can find the paper here: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{editor.name}} assigned you to review "{{paper.title}}" for {{journal.name}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },
            'reviewer:submission:reviewer-unassigned': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{editor.name}} unassigned you from "{{paper.title}}".`),
                    body: Handlebars.compile(`
                    {{editor.name}} unassigned you from "{{paper.title}}".
                    `)
                },
                text: Handlebars.compile(`{{editor.name}} unassigned you from "{{paper.title}}".`),
                path: Handlebars.compile(`/review`)
            },

            /**
             * A user was (un)assigned as an editor to a paper.
             */
            'editor:submission:editor-assigned': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{editor.name}} assigned you to edit "{{paper.title}}" for {{journal.name}}`),
                    body: Handlebars.compile(`
                    {{editor.name}} assigned you to edit "{{paper.title}}" for {{journal.name}}

                    You can view the paper here: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{editor.name}} assigned you to edit "{{paper.title}}" for {{journal.name}}`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },
            'editor:submission:editor-unassigned': {
                email: {
                    subject: Handlebars.compile(`[JournalHub] {{editor.name}} unassigned you from "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{editor.name}} unassigned you from "{{paper.title}}".
                        `)
                },
                text: Handlebars.compile(`{{editor.name}} unassigned you from "{{paper.title}}"`),
                path: Handlebars.compile(`/edit`)
            }
        }

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

    async sendNewReview(currentUser, context) {
        let object = 'paper'

        const paperResults = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ context.review.paperId ])
        const paper = paperResults.dictionary[context.review.paperId]

        const eventResults = await this.paperEventDAO.selectEvents(`WHERE paper_events.review_id = $1`, [ context.review.id ])
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
            
            if ( event.visibility.includes('editors') || event.visibility.includes('assigned-editors') ) {
                const assignedEditorResults = await this.core.database.query(`
                    SELECT user_id FROM journal_submission_editors WHERE submission_id = $1
                `, [ activeSubmissionInfo.id ])

                for(const row of assignedEditorResults.rows) {
                    if ( row.user_id == currentUser.id ) {
                        continue
                    }

                    await this.createNotification(
                        row.user_id,
                        `editor:${object}:new-review`,
                        {
                            paper: paper,
                            review: context.review,
                            reviewer: currentUser
                        }
                    )
                }
            }
        }

        // ======== Authors ===================================================

        if ( event.visibility.includes('public') || event.visibility.includes('authors') ) {
            for(const author of paper.authors) {
                if ( author.userId == currentUser.id ) {
                    continue
                }

                await this.createNotification(
                    author.userId,
                    `author:${object}:new-review`,
                    {
                        paper: paper,
                        review: context.review,
                        reviewer: currentUser 
                    }
                )
            }
        } else if ( event.visibility.includes('corresponding-authors') ) {
            for(const author of paper.authors) {
                if ( author.userId == currentUser.id ) {
                    continue
                }
                if ( ! author.owner ) {
                    continue
                }

                await this.createNotification(
                    author.userId,
                    `author:${object}:new-review`,
                    {
                        paper: paper,
                        review: context.review,
                        reviewer: currentUser 
                    }
                )
            }
        }
    }

    async sendNewComment(currentUser, context) {
        let object = 'paper'
        const notifiedUserIds = [ currentUser.id ]

        const paperResults = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ context.comment.paperId ])
        const paper = paperResults.dictionary[context.comment.paperId]

        const eventResults = await this.paperEventDAO.selectEvents(`WHERE paper_events.paper_comment_id = $1`, [ context.comment.id ])
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

            const isVisibleToAssignedReviewers = event.visibility.includes('assigned-reviewers') 
                || event.visibility.includes('reviewers') || event.visibility.includes('public')

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
                        `reviewer:${object}:new-comment`,
                        {
                            paper: paper,
                            comment: context.comment,
                            user: currentUser
                        }
                    )
                }
            }
            
            // ==== Editors ===================================================
            
            if ( event.visibility.includes('editors') || event.visibility.includes('assigned-editors') ) {
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
                        `editor:${object}:new-comment`,
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

        if ( event.visibility.includes('public') || event.visibility.includes('authors') ) {
            for(const author of paper.authors) {
                if ( notifiedUserIds.includes(author.userId)) {
                    continue
                }

                notifiedUserIds.push(author.userId)
                await this.createNotification(
                    author.userId,
                    `author:${object}:new-comment`,
                    {
                        paper: paper,
                        comment: context.comment,
                        user: currentUser
                    }
                )
            }
        } else if ( event.visibility.includes('corresponding-authors') ) {
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
                    `author:${object}:new-comment`,
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

    async sendNewVersion(currentUser, context) {
        const eventResults = await this.paperEventDAO.selectEvents(
            `WHERE paper_events.type = 'paper:new-version' AND paper_events.paper_id = $1 AND paper_events.version = $2`,
            [ context.paper.id, context.versionNumber ]
        )
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

        const isVisibleToAuthors = event.visibility.includes('authors') || event.visibility.includes('public')
        const isVisibleToCorrespondingAuthors = event.visibility.includes('corresponding-authors') 
            || event.visibility.includes('authors') || event.visibility.includes('public')

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
                    'author:paper:new-version',
                    {
                        correspondingAuthor: currentUser,
                        paper: context.paper 
                    }
                )
            }
        }

        let assignedReviewerIds = []
        let assignedEditorIds = []
        if ( activeSubmissionInfo ) {
            // ==== Assigned Reviewers ========================================

            const isVisibleToAssignedReviewers = event.visibility.includes('assigned-reviewers') 
                || event.visibility.includes('reviewers') || event.visibility.includes('public')

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
                        'reviewer:submission:new-version',
                        {
                            correspondingAuthor: currentUser, 
                            paper: context.paper 
                        }
                    )
                }
            }

          
            // ==== Assigned Editors ==========================================
            
            const isVisibleToAssignedEditors = event.visibility.includes('assigned-editors')
                || event.visibility.includes('editors') || event.visibility.includes('public')
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
                        'editor:submission:new-version',
                        {
                            correspondingAuthor: currentUser,
                            paper: context.paper 
                        }
                    )
                }
            }
        }

        // ======== Preprint Reviewers ========================================
        
        if ( event.visibility.includes('public') ) {
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
                    'reviewer:paper:new-version',
                    {
                        correspondingAuthor: currentUser,
                        paper: context.paper
                    }
                )
            }
        }
    }
    
    async sendPaperSubmitted(currentUser, context) {
        // authors 
        for ( const author of context.paper.authors) {
            if ( author.userId == currentUser.id ) {
                continue
            }

            await this.createNotification(
                author.userId,
                'author:paper:submitted',
                {
                    correspondingAuthor: currentUser,
                    paper: context.paper
                }
            )
        }
    }

    async sendPaperPreprintPosted(currentUser, context) {
        for(const author of context.paper.authors) {
            if ( author.userId == currentUser.id ) {
                continue
            }

            await this.createNotification(
                author.userId,
                'author:paper:preprint-posted',
                {
                    correspondingAuthor: currentUser,
                    paper: context.paper 
                }
            )
        }
    }

    async sendPaperReviewCommentReply(currentUser, context) {
        throw new ServiceError('not-implemented', `Not yet implemented.`)
    }

    async sendJournalInvited(currentUser, context) {
        // Don't notify the user of their own actions.
        if ( currentUser.id == context.member.userId ) {
            return
        }

        await this.createNotification(
            context.member.userId,
            'journal-member:journal:invited',
            {
                user: currentUser,
                journal: context.journal 
            }
        )
    }

    async sendJournalRoleChanged(currentUser, context) {
        throw new ServiceError('not-implemented', 'Not yet implemented.')
    }

    async sendJournalRemoved(currentUser, context) {
        throw new ServiceError('not-implemented', 'Not yet implemented.')
    }

    async sendSubmissionNew(currentUser, context) {
        const eventResults = await this.paperEventDAO.selectEvents(
            `WHERE paper_events.type='submission:new' AND paper_events.submission_id = $1`,
            [ context.submission.id ]
        )
        if ( eventResults.list.length <= 0 ) {
            throw new ServiceError('missing-event', 
                `Missing submission event for Submission(${context.submission.id}).`)
        }
        const event = eventResults.dictionary[eventResults.list[0]]

        const paperResults = await this.paperDAO.selectPapers('WHERE papers.id = $1', [ context.paperId ])
        if ( paperResults.list.length <= 0 ) {
            throw new ServiceError('missing-paper',
                `Missing Paper(${context.paperId}).`)
        }
        const paper = paperResults.list[0]

        // ======== Authors ===================================================
       
        let notifiedAuthors = []
        if ( event.visibility.includes('authors') || event.visibility.includes('public') ) {
            for(const author of paper.authors) {
                if ( author.userId == currentUser.id) {
                    continue
                }

                notifiedAuthors.push(author.userId)
                await this.createNotification(
                    author.userId,
                    'author:submission:new',
                    {
                        correspondingAuthor: currentUser,
                        paper: context.paper,
                        journal: context.journal
                    }
                )
            }
        }

        // ======== Editors ===================================================

        const visibleToEditors = event.visibility.includes('editors') || event.visibility.includes('public')
        const visibleToManagingEditors = event.visibility.includes('managing-editors') 
            || event.visibility.includes('editors') || event.visibility.includes('public')
        
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
                'editor:submission:new',
                {
                    correspondingAuthor: currentUser,
                    paper: paper,
                    journal: context.journal
                }
            )
        }
    }

    async sendSubmissionReviewCommentReply(currentUser, context) {
        throw new ServiceError('not-implemented', 'Not yet implemented.')
    }

    async sendSubmissionStatusChanged(currentUser, context) {
        throw new ServiceError('not-implemented', 'Not yet implemented.')

    }

    async sendSubmissionReviewerAssigned(currentUser, context) {
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
            'reviewer:submission:reviewer-assigned',
            {
                editor: currentUser,
                paper: {
                    id: context.paperId,
                    title: title
                },
                journal: context.journal
            }
        )
    }

    async sendSubmissionReviewerUnassigned(currentUser, context) {
        if ( currentUser.id == context.reviewerId ) {
            return
        }

        const notificationResults = await this.core.database.query(`
            SELECT papers.title FROM papers WHERE papers.id = $1
        `, [ context.paperId ])
        const title = notificationResults.rows[0].title

        await this.createNotification(
            context.reviewerId,
            'reviewer:submission:reviewer-unassigned',
            {
                editor: currentUser,
                paper: {
                    id: context.paperId,
                    title: title
                },
                journal: context.journal

            }
        )
    }

    async sendSubmissionEditorAssigned(currentUser, context) {
        if ( currentUser.id == context.editor.userId ) {
            return
        }

        const notificationResults = await this.core.database.query(`
            SELECT papers.title FROM papers WHERE papers.id = $1
        `, [ context.paperId ])
        const title = notificationResults.rows[0].title

        await this.createNotification(
            context.editor.userId,
            'editor:submission:editor-assigned',
            {
                editor: currentUser,
                paper: {
                    id: context.paperId,
                    title: title
                },
                journal: context.journal
            }

        )
    }

    async sendSubmissionEditorUnassigned(currentUser, context) {
        if ( currentUser.id == context.editorId ) {
            return
        }

        const notificationResults = await this.core.database.query(`
            SELECT papers.title FROM papers WHERE papers.id = $1
        `, [ context.paperId ])
        const title = notificationResults.rows[0].title

        await this.createNotification(
            context.editorId,
            'editor:submission:editor-unassigned',
            {
                editor: currentUser,
                paper: {
                    id: context.paperId,
                    title: title
                },
                journal: context.journal
            }
        )

    }

    async sendNotifications(currentUser, type, context) {
        return await this.notificationMap[type](currentUser, context)
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
    async createNotification(userId, type, context) {
        const definition = this.notificationDefinitions[type]
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
