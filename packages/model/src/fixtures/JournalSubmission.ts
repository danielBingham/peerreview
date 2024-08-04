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

import { ResultType } from "../types/Query"
import { 
    JournalSubmission
} from "../types/JournalSubmission"

import { generateFixture } from './generateFixture'

const journalSubmissions: JournalSubmission[] = [
    // Fixture 1: New Submission with no Assignees
    {
        id: 1,
        journalId: 1,
        paperId: 1,
        status: 'submitted',
        submitterId: 1,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        reviewers: [],
        editors: []
    },

    // Fixture 2: Submission in Review with assigned reviewers and editors
    {
        id: 2,
        journalId: 2,
        paperId: 2,
        status: 'in-review',
        submitterId: 2,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        reviewers: [
            {
                submissionId: 2,
                userId: 1,
                assignedDate: 'TIMESTAMP',
                reviews: []
            },
            {
                submissionId: 2,
                userId: 2,
                assignedDate: 'TIMESTAMP',
                reviews: [
                    {
                        id: 1,
                        version: 1,
                        recommendation: 'approved',
                        userId: 2
                    }
                ]
            }
        ],
        editors: [
            {
                submissionId: 2,
                userId: 1,
                assignedDate: 'TIMESTAMP'
            },
            {
                submissionId: 2,
                userId: 2,
                assignedDate: 'TIMESTAMP'
            }
        ]
    }
]

export function getJournalSubmissionFixture(filter?: (element: any, index: any, array: any[]) => boolean) {
    return generateFixture<JournalSubmission>(journalSubmissions, filter)
}
