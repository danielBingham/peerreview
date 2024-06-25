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
 * Represents a submission to a journal, linking a paper to the journal it has
 * been submitted to and storing any information about the submission itself.
 */
export interface JournalSubmission extends Model {
    journalId: number
    paperId: number
    submitterId: number
    status: string
    createdDate: string
    updatedDate: string
    reviewers: JournalSubmissionReviewer[]
    editors: JournalSubmissionEditor[]
}


/**
 * Represents a reviewer assignment to a submission to a journal.
 */
export interface JournalSubmissionReviewer {
    submissionId: number
    userId: number
    assignedDate: string
    reviews: JournalSubmissionReview[]
}

/**
 * Review information needed when displaying reviewer assignments.
 */
export interface JournalSubmissionReview {
    id: number
    version: number
    recommendation: string
    userId: number
}

/**
 * Represents an editor assignment to a submission to a journal.
 */
export interface JournalSubmissionEditor {
    submissionId: number
    userId: number
    assignedDate: string
}


/**
 * 
 */
export interface PartialJournalSubmission {
    id?: number
    journalId?: number
    paperId?: number
    submitterId?: number
    status?: string
    reviewers?: JournalSubmissionReviewer[]
    editors?: JournalSubmissionEditor[]
}
