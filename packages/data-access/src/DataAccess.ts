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
import { Core } from '@journalhub/core' 

import { FieldDAO } from './daos/FieldDAO'
import { FileDAO } from './daos/FileDAO'
import { JournalDAO } from './daos/JournalDAO'
import { JournalSubmissionDAO } from './daos/JournalSubmissionDAO'
import { NotificationDAO } from './daos/NotificationDAO'
import { PaperCommentDAO } from './daos/PaperCommentDAO'
import { PaperDAO } from './daos/PaperDAO'
import { PaperEventDAO } from './daos/PaperEventDAO'
import { PermissionDAO } from './daos/PermissionDAO'
import { ReviewDAO } from './daos/ReviewDAO'
import { TokenDAO } from './daos/TokenDAO'
import { UserDAO } from './daos/UserDAO'

export class DataAccess {
    field: FieldDAO
    file: FileDAO
    journal: JournalDAO
    journalSubmission: JournalSubmissionDAO
    notification: NotificationDAO
    paperComment: PaperCommentDAO
    paper: PaperDAO
    paperEvent: PaperEventDAO
    permission: PermissionDAO
    review: ReviewDAO
    token: TokenDAO
    user: UserDAO

    constructor(core: Core) {
        this.field = new FieldDAO(core)
        this.file = new FileDAO(core)
        this.journal = new JournalDAO(core)
        this.journalSubmission = new JournalSubmissionDAO(core)
        this.notification = new NotificationDAO(core)
        this.paperComment = new PaperCommentDAO(core)
        this.paper = new PaperDAO(core)
        this.paperEvent = new PaperEventDAO(core)
        this.permission = new PermissionDAO(core)
        this.review = new ReviewDAO(core)
        this.token = new TokenDAO(core)
        this.user = new UserDAO(core)
    }
}

