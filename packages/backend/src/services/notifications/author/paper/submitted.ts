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

import { NotificationTemplate } from '../../NotificationTemplate'

export const Author_Paper_Submitted: NotificationTemplate = {
    email: {
        subject: Handlebars.compile('[JournalHub] Your co-author, {{correspondingAuthor.name}}, submitted "{{paper.title}}"'), 
        body: Handlebars.compile(`
            Your co-author, {{correspondingAuthor.name}}, submitted "{{paper.title}}" on which you are listed as a co-author to JournalHub.  You can find the paper, collaborate with your co-authors, solicit preprint review, submit to journals, communicate with your reviewers and more on JournalHub.

            You can find the paper here: {{host}}paper/{{paper.id}}/file
        `)
    },
    text: Handlebars.compile(`Your co-author, {{correspondingAuthor.name}}, submittted paper "{{paper.title}}".`),
    path: Handlebars.compile(`/paper/{{paper.id}}/file`) 
}
