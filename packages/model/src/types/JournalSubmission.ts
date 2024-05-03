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

export interface JournalSubmissionReview {
    id: number
    version: number
    recommendation: string
    userId: number
}

export interface JournalSubmissionReviewer {
    userId: number
    assignedDate: string
    reviews: JournalSubmissionReview[]
}

export interface JournalSubmissionEditor {
    userId: number
    assignedDate: string
}

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

export interface PartialJournalSubmission {
    id?: number
    journalId?: number
    submitterId?: number
    paperId?: number
    status?: string
}
