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
import Handlebars from 'handlebars'

import { NotificationDefinition } from '../../NotificationDefinition'

export const JournalMember_Journal_Invited: NotificationDefinition = {
    email: {
        subject: Handlebars.compile(`[JournalHub] {{user.name}} invited you to join {{journal.name}}`),
        body: Handlebars.compile(`
                                 You have been invited by {{user.name}} to join {{journal.name}}.

                                     View the journal here: {{host}}journal/{{journal.id}}
                                 `)
    },
    text: Handlebars.compile(`{{user.name}} invited you to join {{journal.name}}`),
    path: Handlebars.compile(`/journal/{{journal.id}}`)
}