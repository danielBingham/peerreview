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

/**
 * Defines the types of notifications that may be sent to users. Notification
 * types are defined as `reciever:object:event`.
 */
export enum NotificationType {
    /* ============ Paper Notifications ======================================= */
    /* User was added to a paper as an author. */
    Author_Paper_Submitted = 'author:paper:submitted', 
    
    /* 
     * A new version was uploaded for a paper the user is an author, editor, or
     * reviewer on. 
     */
    Author_Paper_NewVersion = 'author:paper:new-version', 
    Reviewer_Paper_NewVersion = 'reviewer:paper:new-version',

    /**
     * A paper the user is an author of was submitted as a preprint.
     */
    Author_Paper_PreprintPosted = 'author:paper:preprint-posted',

    /**
     * A review was posted to a paper that the user is an author of.
     */
    Author_Paper_NewReview = 'author:paper:new-review',

    /**
     * A reply was posted to a comment thread the user is participating in. TODO
     */
    Author_Paper_ReviewCommentReply = 'author:paper:review-comment-reply',
    Reviewer_Paper_ReviewCommentReply = 'reviewer:paper:review-comment-reply',

    /**
     * A comment was posted to the timeline of a paper the user is an author,
     * reviewer, or editor for. TODO
     */
    Author_Paper_NewComment = 'author:paper:new-comment',
    Reviewer_Paper_NewComment = 'reviewer:paper:new-comment',
   
    /* ============ Journal Notifications ===================================== */
    /**
     * User has been added to a journal's team.
     */
    JournalMember_Journal_Invited = 'journal-member:journal:invited',

    /**
     * Role in journal changed. TODO
     */
    JournalMember_Journal_RoleChanged = 'journal-member:journal:role-changed',

    /**
     * User removed from journal's team. TODO
     */
    JournalMember_Journal_Removed = 'journal-member:journal:removed',

    /* ============ Submission Notifications ================================== */
    

    /**
     * A paper the user is an author of was submitted to a journal.
     * A journal the user is a managing editor of received a new submission.
     */
    Author_Submission_New = 'author:submission:new', 
    Editor_Submission_New = 'editor:submission:new',

    /* 
     * A new version was uploaded for a submission the user is an editor, or
     * reviewer on. 
     */
    Author_Submission_NewVersion = 'author:submission:new-version',
    Reviewer_Submission_NewVersion = 'reviewer:submission:new-version',
    Editor_Submission_NewVersion = 'editor:submission:new-version',

    /**
     * A new review was submitted for a submission the user is editing.
     */ 
    Author_Submission_NewReview = 'author:submission:new-review',
    Editor_Submission_NewReview = 'editor:submission:new-review',

    /**
     * A reply was posted to a comment thread the user is participating in. TODO
     */
    Author_Submission_ReviewCommentReply = 'author:submission:review-comment-reply',
    Reviewer_Submission_ReviewCommentReply = 'reviewer:submission:review-comment-reply',
    Editor_Submission_ReviewCommentReply = 'editor:submission:review-comment-reply',

    /**
     * A new timeline comment on a paper the user is a reviewer or editor for.
     */
    Author_Submission_NewComment = 'author:submission:new-comment',
    Reviewer_Submission_NewComment = 'reviewer:submission:new-comment',
    Editor_Submission_NewComment = 'editor:submission:new-comment',

    /**
     * The status of a submission the user is an author of changed.
     */
    Author_Submission_StatusChanged = 'author:submission:status-changed',
    Editor_Submission_StatusChanged = 'editor:submission:status-changed',

    /**
     * A user was (un)assigned as a reviewer to a paper. 
     */
    Reviewer_Submission_ReviewerAssigned = 'reviewer:submission:reviewer-assigned',
    Reviewer_Submission_ReviewerUnassigned = 'reviewer:submission:reviewer-unassigned',

    /**
     * A user was (un)assigned as an editor to a paper.
     */
    Editor_Submission_EditorAssigned = 'editor:submission:editor-assigned',
    Editor_Submission_EditorUnassigned = 'editor:submission:editor-unassigned'

}

/**
 * Represents a notification that has been sent to User(userId).
 */
export interface Notification extends Model {
    userId: number
    type: NotificationType
    description: string
    path: string
    isRead: boolean
    createdDate: string
    updatedDate: string
}

export interface PartialNotification {
    id?: number
    userId?: number
    type?: NotificationType
    description?: string
    path?: string
    isRead?: boolean
}
