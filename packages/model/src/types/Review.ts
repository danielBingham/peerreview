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

export enum ReviewStatus {
    InProgress = 'in-progress',
    Submitted = 'submitted',
    Rejected = 'rejected',
    Accepted = 'accepted'
}

export enum ReviewRecommendation {
    Commentary = 'commentary',
    RequestChanges = 'request-changes',
    Reject = 'reject',
    Approve = 'approve'
}

export interface ReviewComment {
    id: number
    threadId: number
    userId: number
    version?: number
    threadOrder: number
    status: string
    content: string
    createdDate: string
    updatedDate: string
}

export interface ReviewThread {
    id: number
    reviewId: number
    page: number
    pinX: number
    pinY: number
    comments: ReviewComment[]
}

export interface Review extends Model {
    paperId: number
    submissionId: number
    userId: number
    version: number
    number: number
    summary: string
    recommendation: ReviewRecommendation 
    status: ReviewStatus
    createdDate: string
    updatedDate: string
    threads: ReviewThread[] 
}
