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

export const JournalMember_Journal_RoleChanged: NotificationDefinition = {
    email: {
        subject: Handlebars.compile(`[JournalHub] {{user.name}} changed your role for {{journal.name}} to {{role}}`),
        body: Handlebars.compile(`
                                 Your co-author, {{correspondingAuthor.name}} submitted a preprint of "{{paper.title}}".

                                     You can go here to view the preprint: {{host}}paper/{{paper.id}}/file
                                 `)
    },
    text: Handlebars.compile(`{{user.name}} changed your role for {{journal.name}} to {{role}}`),
    path: Handlebars.compile(`/paper/{{paper.id}}/file`)
}