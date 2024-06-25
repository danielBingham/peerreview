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
import { Model } from './Model'

export enum PaperEventType {
    Paper_NewVersion = 'paper:new-version', 
    Paper_PreprintPosted = 'paper:preprint-posted',
    Paper_NewReview = 'paper:new-review', 
    Paper_NewComment = 'paper:new-comment',
    Review_CommentReplyPosted = 'review:comment-reply-posted',
    JournalSubmission_New = 'submission:new', 
    JournalSubmission_NewReview = 'submission:new-review',
    JournalSubmission_NewComment = 'submission:new-comment',
    JournalSubmission_StatusChanged = 'submission:status-changed',
    JournalSubmission_ReviewerAssigned = 'submission:reviewer-assigned',
    JournalSubmission_ReviewerUnassigned = 'submission:reviewer-unassigned',
    JournalSubmission_EditorAssigned = 'submission:editor-assigned',
    JournalSubmission_EditorUnassigned = 'submission:editor-unassigned',
}

export enum PaperEventRootType {
    NewReview = 'new-review'
}

export enum PaperEventStatus {
    InProgress = 'in-progress',
    Committed = 'committed'

}

export enum PaperEventVisibility {
    ManagingEditors = 'managing-editors',
    Editors = 'editors',
    AssignedEditors = 'assigned-editors',
    Reviewers = 'reviewers',
    AssignedReviewers = 'assigned-reviewers',
    CorrespondingAuthors = 'corresponding-authors',
    Authors = 'authors',
    Public = 'public'
}

export interface PaperEvent extends Model {
    paperId: number
    actorId: number
    version: number
    status: PaperEventStatus 
    type: PaperEventType 
    visibility: PaperEventVisibility[]
    eventDate: string

    assigneeId?: number
    reviewId?: number
    reviewCommentId?: number
    submissionId?: number
    newStatus?: string
    paperCommentId?: number
}

export interface PartialPaperEvent {
    id?: number
    paperId?: number
    actorId?: number
    version?: number
    status?: PaperEventStatus
    type?: PaperEventType|PaperEventRootType
    visibility?: PaperEventVisibility[]
    eventDate?: string


    assigneeId?: number
    reviewId?: number
    reviewCommentId?: number
    submissionId?: number
    newStatus?: string
    paperCommentId?: number
}
