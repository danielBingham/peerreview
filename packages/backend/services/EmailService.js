const ServiceError = require('../errors/ServiceError')

module.exports = class EmailService {

    constructor(core) {
        this.core = core 

        this.logger = core.logger
        this.config = core.config
    }

    async sendEmail(data) {
        try {
            await this.core.postmarkClient.sendEmail(data)
        } catch (error) {
            console.error(error)
            throw new ServiceError('email-failed', 
                `Attempt to send an email failed with message: ${error.message}.`)
        }
    }

    async sendNotificationEmail(address, subject, body) {
        await this.sendEmail({
            "From": "no-reply@peer-review.io",
            "To": address,
            "Subject": subject,
            "TextBody": body,
            "MessageStream": "notifications"
        })
    }

    async sendEmailConfirmation(user, token) {
        const confirmationLink = this.config.host + `email-confirmation?token=${token.token}`


        const emailTextBody = `Welcome to JournalHub, ${user.name}!

Please confirm your email address by following the link below:
${confirmationLink}`


        await this.sendEmail({
            "From": "no-reply@peer-review.io",
            "To": user.email,
            "Subject": "[JournalHub] Welcome to JournalHub, ${user.name}!",
            "TextBody": emailTextBody,
            "MessageStream": "email-confirmation"
        })
    }

    async sendPasswordReset(user, token) {
        const resetLink = this.config.host + `reset-password?token=${token.token}`

        const emailTextBody = `Hello ${user.name},

        Please use the following link to reset your password:
${resetLink}`


        await this.sendEmail({
            "From": "no-reply@peer-review.io",
            "To": user.email,
            "Subject": "[JournalHub] Please reset your password",
            "TextBody": emailTextBody,
            "MessageStream": "password-reset"
        })
    }

    async sendInvitation(inviter, user, token) {
        const invitationLink = this.config.host + `accept-invitation?token=${token.token}`

        const emailTextBody = `Hello ${user.name},

        You have been invited to join Peer Review by ${inviter.name} (${inviter.email})!  Peer
        Review is an open source, diamond open access (free to access, free to
        publish) academic publishing platform.  Our goal is to build an open
        platform where scholars can get constructive feedback, work together to
        maintain the integrity of the literature, and share their work with
        each other and the world.

        If you join, you can use the platform to publish your work, to review
        the work of your peers, and to help ensure that good work is
        highlighted, and dishonest work is marked as such.

        To accept the invitation click the following link : ${invitationLink}`


        await this.sendEmail({
            "From": "no-reply@peer-review.io",
            "To": user.email,
            "Subject": `${inviter.name} invites you to join Peer Review`,
            "TextBody": emailTextBody,
            "MessageStream": "invitation"
        })
    }



}


