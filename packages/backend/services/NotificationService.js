
const Handlebars = require('handlebars')

const NotificationDAO = require('../daos/NotificationDAO')

const EmailService = require('../services/EmailService')


module.exports = class NotificationService {


    constructor(core) {
        this.core = core

        this.notificationDAO = new NotificationDAO(core)

        this.emailService = new EmailService(core)

        this.notificationDefinitions = {

            /* User was added to a paper as an author. */
            'author:paper-submitted': {
                email: {
                    subject: Handlebars.compile('Your co-author, {{correspondingAuthor.name}}, submitted "{{paper.title}}" to JournalHub'), 
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
            'author:new-version': {
                email: {
                    subject: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    Your co-author, {{correspondingAuthor.name}} uploaded a new version of "{{paper.title}}".

                    You can go here to view the version: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of {{paper.title}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            }, 
            'reviewer:new-version': {
                email: {
                    subject: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of you review assignment, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{correspondingAuthor.name}} uploaded a new version of "{{paper.title}}", which you are assigned to review.

                    You can go here to view the version: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of your review assignment, {{paper.title}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)

            },
            'editor:new-version': {
                email: {
                    subject: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of your editorial assignment, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{correspondingAuthor.name}} uploaded a new version of your editoral assignment, "{{paper.title}}".

                    You can go here to view the version: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} uploaded a new version of your editorial assignment, "{{paper.title}}".`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)

            },

            /**
             * A paper the user is an author of was submitted as a preprint.
             */
            'author:preprint-posted': {
                email: {
                    subject: Handlebars.compile(`{{correspondingAuthor.name}} submitted a preprint of "{{paper.title}}"`),
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
            'author:new-review': {
                email: {
                    subject: Handlebars.compile(`A new review of "{{paper.title}}" has been posted`),
                    body: Handlebars.compile(`
                    A new review of "{{paper.title}}" has been posted. 

                    Read the review: {{host}}paper/{{paper.id}}/timeline#review-{{review.id}}
                    `)
                },
                text: Handlebars.compile(`A new review of "{{paper.title}}" has been posted`),
                path: Handlebars.compile(`/paper/{{paper.id}}/timeline#review-{{review.id}}`)
            },
            'editor:new-review': {
                email: {
                    subject: Handlebars.compile(`{{reviewer.name}} posted a new review of your editorial assignment, "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{reviewer.name}} posted a new review of "{{paper.title}}", which you are assigned to edit.

                    Read the review: {{host}}paper/{{paper.id}}/timeline#review-{{review.id}}
                    `)
                },
                text: Handlebars.compile(`{{reviewer.name}} posted a new review of your editorial assignment, "{{paper.title}}"`),
                path: Handlebars.compile(`{{host}}paper/{{paper.id}}/timeline#review-{{review.id}}`)
            },

            /**
             * A reply was posted to a comment thread the user is participating in. TODO
             */
            'author:review-comment-reply': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },
            'reviewer:review-comment-reply': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },
            'editor:review-comment-reply': {
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
            'author:new-comment': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },
            'reviewer:new-comment': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },
            'editor:new-comment': {
                email: {
                    subject: Handlebars.compile(`TODO`),
                    body: Handlebars.compile(`TODO`)
                },
                text: Handlebars.compile(`TODO`),
                path: Handlebars.compile(`TODO`)
            },

            /**
             * User has been added to a journal's team.
             */
            'journal-member:invited': {
                email: {
                    subject: Handlebars.compile(`{{user.name}} invited you to join {{journal.name}}`),
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
            'journal-member:role-changed': {
                email: {
                    subject: Handlebars.compile(`{{user.name}} changed your role for {{journal.name}} to {{role}}`),
                    body: Handlebars.compile(`
                    Your co-author, {{correspondingAuthor.name}} submitted a preprint of "{{paper.title}}".

                    You can go here to view the preprint: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} submitted a preprint of "{{paper.title}}".`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },

            /**
             * User removed from journal's team. TODO
             */
            'journal-member:removed': {
                email: {
                    subject: Handlebars.compile(`{{user.name}} removed you from {{journal.name}}`),
                    body: Handlebars.compile(`
                    You have been removed from the membership of {{journal.name}}.
                    `)
                },
                text: Handlebars.compile(`{{user.name}} removed you from {{journal.name}}`),
                path: Handlebars.compile(`/journal/{{journal.id}}`)
            },

            /**
             * A paper the user is an author of was submitted to a journal.
             * A journal the user is a managing editor of received a new submission.
             */
            'author:new-submission': {
                email: {
                    subject: Handlebars.compile(`Your co-author, {{correspondingAuthor.name}}, submitted "{{paper.title}}" to {{journal.name}}`),
                    body: Handlebars.compile(`
                    Your co-author, {{correspondingAuthor.name}}, submitted "{{paper.title}}" to {{journal.name}}.

                    You can go here to view the submission: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} submitted "{{paper.title}}" to {{journal.name}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            }, 
            'editor:new-submission': {
                email: {
                    subject: Handlebars.compile(`{{correspondingAuthor.name}} submitted "{{paper.title}}" to {{journal.name}}`),
                    body: Handlebars.compile(`
                    {{correspondingAuthor.name}} submitted "{{paper.title}}" to {{journal.name}}.

                    You can go here to view the submission: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{correspondingAuthor.name}} submitted "{{paper.title}}" to {{journal.name}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },

            /**
             * The status of a submission the user is an author of changed.
             */
            'author:submission-status-changed': {
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
            'reviewer:submission-assigned': {
                email: {
                    subject: Handlebars.compile(`{{editor.name}} assigned you to review "{{paper.title}}" for {{journal.name}}.`),
                    body: Handlebars.compile(`
                    {{editor.name}} assigned you to review "{{paper.title}}" for {{journal.name}}.

                    You can find the paper here: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{editor.name}} assigned you to review "{{paper.title}}" for {{journal.name}}.`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },
            'reviewer:submission-unassigned': {
                email: {
                    subject: Handlebars.compile(`{{editor.name}} unassigned you from "{{paper.title}}".`),
                    body: Handlebars.compile(`
                    {{editor.name}} unassigned you from "{{paper.title}}".  You are off the hook!
                    `)
                },
                text: Handlebars.compile(`{{editor.name}} unassigned you from "{{paper.title}}".`),
                path: Handlebars.compile(`/review`)
            },

            /**
             * A user was (un)assigned as an editor to a paper.
             */
            'editor:submission-assigned': {
                email: {
                    subject: Handlebars.compile(`{{editor.name}} assigned you to edit "{{paper.title}}" for {{journal.name}}`),
                    body: Handlebars.compile(`
                    {{editor.name}} assigned you to edit "{{paper.title}}" for {{journal.name}}

                    You can view the paper here: {{host}}paper/{{paper.id}}/file
                    `)
                },
                text: Handlebars.compile(`{{editor.name}} assigned you to edit "{{paper.title}}" for {{journal.name}}`),
                path: Handlebars.compile(`/paper/{{paper.id}}/file`)
            },
            'editor:submission-unassigned': {
                email: {
                    subject: Handlebars.compile(`{{editor.name}} unassigned you from "{{paper.title}}"`),
                    body: Handlebars.compile(`
                    {{editor.name}} unassigned you from "{{paper.title}}".  You are off the hook!
                        `)
                },
                text: Handlebars.compile(`{{editor.name}} unassigned you from "{{paper.title}}"`),
                path: Handlebars.compile(`/edit`)
            }
        }
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
