const Postmark = require('postmark')

module.exports = class EmailService {

    constructor(logger, config) {
        this.logger = logger
        this.config = config

        this.postmarkClient = new Postmark.ServerClient(config.postmark.api_token)
    }

    sendEmailConfirmation(user, token) {
        const confirmationLink = this.config.host + `email-confirmation?token=${token.token}`


        const emailTextBody = `Welcome to Peer Review, ${user.name}!

Please confirm your email address by following the link below:
${confirmationLink}`


        this.postmarkClient.sendEmail({
            "From": "no-reply@peer-review.io",
            "To": user.email,
            "Subject": "Peer Review(io) - Email Confirmation",
            "TextBody": emailTextBody,
            "MessageStream": "email-confirmation"
        })
    }

}


