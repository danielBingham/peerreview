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

/******************************************************************************
 * Fixtures for the `journal_submissions`, `journal_submission_reviewers`, and
 * `journal_submission_editors`  database tables for use in tests.
 *
 * Represents the rows returned by the `SELECT` statement used in the
 * `JournalSubmissionDAO`.
 *
 ******************************************************************************/

import { getTableFixture } from './getTableFixture'

const journal_submissions = [
    {
        JournalSubmission_id: 1,
        JournalSubmission_journalId: 1,
        JournalSubmission_paperId: 1,
        JournalSubmission_status: 'submitted',
        JournalSubmission_submitterId: 1,
        JournalSubmission_createdDate: 'TIMESTAMP',
        JournalSubmission_updatedDate: 'TIMESTAMP'
    },
    {
        JournalSubmission_id: 2,
        JournalSubmission_journalId: 2,
        JournalSubmission_paperId: 2,
        JournalSubmission_status: 'in-review',
        JournalSubmission_submitterId: 2,
        JournalSubmission_createdDate: 'TIMESTAMP',
        JournalSubmission_updatedDate: 'TIMESTAMP'
    }
]

const journal_submission_reviewers = [
    {
        JournalSubmissionReviewer_submissionId: null,
        JournalSubmissionReviewer_userId: null,
        JournalSubmissionReviewer_assignedDate: null
    },
    {
        JournalSubmissionReviewer_submissionId: 2,
        JournalSubmissionReviewer_userId: 1,
        JournalSubmissionReviewer_assignedDate: 'TIMESTAMP'
    },
    {
        JournalSubmissionReviewer_submissionId: 2,
        JournalSubmissionReviewer_userId: 2,
        JournalSubmissionReviewer_assignedDate: 'TIMESTAMP'
    }
]

const journal_submission_reviews = [
    {
        JournalSubmissionReview_id: null,
        JournalSubmissionReview_version: null,
        JournalSubmissionReview_recommendation: null,
        JournalSubmissionReview_userId: null
    },
    {
        JournalSubmissionReview_id: 1,
        JournalSubmissionReview_version: 1,
        JournalSubmissionReview_recommendation: 'approved',
        JournalSubmissionReview_userId: 2
    }
]

const journal_submission_editors = [
    {
        JournalSubmissionEditor_submissionId: null,
        JournalSubmissionEditor_userId: null,
        JournalSubmissionEditor_assignedDate: null
    },
    {
        JournalSubmissionEditor_submissionId: 2,
        JournalSubmissionEditor_userId: 1,
        JournalSubmissionEditor_assignedDate: 'TIMESTAMP'
    },
    {
        JournalSubmissionEditor_submissionId: 2,
        JournalSubmissionEditor_userId: 2,
        JournalSubmissionEditor_assignedDate: 'TIMESTAMP'
    }
]

const journalSubmissionRows = [
    // Fixture 1: New Submission with no Assignees
    { ...journal_submissions[0], ...journal_submission_reviewers[0], ...journal_submission_editors[0], ...journal_submission_reviews[0] },

    // Fixture 2: Submission in Review with assigned reviewers and editors
    { ...journal_submissions[1], ...journal_submission_reviewers[1], ...journal_submission_editors[1], ...journal_submission_reviews[0] },
    { ...journal_submissions[1], ...journal_submission_reviewers[1], ...journal_submission_editors[2], ...journal_submission_reviews[0] },
    { ...journal_submissions[1], ...journal_submission_reviewers[2], ...journal_submission_editors[1], ...journal_submission_reviews[1] },
    { ...journal_submissions[1], ...journal_submission_reviewers[2], ...journal_submission_editors[2], ...journal_submission_reviews[1] }
]

export function getJournalSubmissionsTableJoinFixture(
    filter?: (element: any, index:any, array: any[]) => boolean
) {
    return getTableFixture(journalSubmissionRows, filter)
}
