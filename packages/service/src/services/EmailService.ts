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
import { Core, ServiceError } from '@danielbingham/peerreview-core' 

import { User } from '@danielbingham/peerreview-model'

import { Message } from 'postmark'

export class EmailService {
    core: Core

    constructor(core: Core) {
        this.core = core 
    }

    async sendEmail(data: Message): Promise<void> {
        try {
            await this.core.postmarkClient.sendEmail(data)
        } catch (error) {
            this.core.logger.error(error)
            throw new ServiceError('email-failed', 
                `Attempt to send an email failed with message: ${error.message}.`)
        }
    }

    async sendNotificationEmail(address: string, subject: string, body: string): Promise<void> {
        await this.sendEmail({
            "From": "no-reply@peer-review.io",
            "To": address,
            "Subject": subject,
            "TextBody": body,
            "MessageStream": "notifications"
        })
    }

    async sendEmailConfirmation(user: User, token: string): Promise<void> {
        const confirmationLink = this.core.config.host + `email-confirmation?token=${token}`


        const emailTextBody = `Welcome to JournalHub, ${user.name}!

Please confirm your email address by following the link below:
${confirmationLink}`


        await this.sendEmail({
            "From": "no-reply@peer-review.io",
            "To": user.email,
            "Subject": `[JournalHub] Welcome to JournalHub, ${user.name}!`,
            "TextBody": emailTextBody,
            "MessageStream": "email-confirmation"
        })
    }

    async sendPasswordReset(user: User, token: string): Promise<void> {
        const resetLink = this.core.config.host + `reset-password?token=${token}`

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

    async sendInvitation(inviter: User, user: User, token: string): Promise<void> {
        const invitationLink = this.core.config.host + `accept-invitation?token=${token}`

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


