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
import { 
    Paper, 
    PartialPaper,
    PaperComment, 
    JournalSubmission, 
    Journal,
    JournalMember,
    Review, 
    User
} from '@danielbingham/peerreview-model'

export interface NotificationContext {
    paper?: Paper
    paperId?: number
    partialPaper?: PartialPaper

    correspondingAuthor?: User
    comment?: PaperComment 

    user?: User

    journal?: Journal
    submission?: JournalSubmission

    reviewerUser?: User
    editorUser?: User 

    editor?: JournalMember
    editorId?: number

    reviewer?: JournalMember 
    reviewerId?: number

    member?: JournalMember

    review?: Review

    host?: string
}
