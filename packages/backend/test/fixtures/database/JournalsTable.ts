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
 * Fixtures for the `journals` and `journal_members` database tables for use in
 * tests.
 *
 * Represents the rows returned by the `SELECT` statement used in the
 * `JournalDAO`.
 *
 * @see `journals` and `journal_members` tables in
 * `database/initialization-scripts/schema.sql`
 *
 ******************************************************************************/

import { getTableFixture } from './getTableFixture'

const journal_members = [
    // Fixture 1: Journal of Traditional Publishing  
    // @see packages/model/src/fixtures/Journal.ts -> Fixture 1
    // 0
    {
        Member_journalId: 1,
        Member_userId: 1,
        Member_permissions: 'owner',
        Member_order: 1,
        Member_createdDate: 'TIMESTAMP',
        Member_updatedDate: 'TIMESTAMP'

    },
    // 1
    {
        Member_journalId: 1,
        Member_userId: 2,
        Member_permissions: 'editor',
        Member_order: 2,
        Member_createdDate: 'TIMESTAMP',
        Member_updatedDate: 'TIMESTAMP'
    },
    // 2
    {
        Member_journalId: 1,
        Member_userId: 3,
        Member_permissions: 'editor',
        Member_order: 3,
        Member_createdDate: 'TIMESTAMP',
        Member_updatedDate: 'TIMESTAMP'
    },

    // Fixture 2: Journal of Open Publishing
    // @see packages/model/src/fixtures/Journal.ts -> Fixture 2
    // 3
    {
        Member_journalId: 2,
        Member_userId: 2,
        Member_permissions: 'owner',
        Member_order: 1,
        Member_createdDate: 'TIMESTAMP',
        Member_updatedDate: 'TIMESTAMP'
    },
    // 4
    {
        Member_journalId: 2,
        Member_userId: 3,
        Member_permissions: 'editor',
        Member_order: 2,
        Member_createdDate: 'TIMESTAMP',
        Member_updatedDate: 'TIMESTAMP'
    },
    // 5
    {
        Member_journalId: 2,
        Member_userId: 1,
        Member_permissions: 'reviewer',
        Member_order: 3,
        Member_createdDate: 'TIMESTAMP',
        Member_updatedDate: 'TIMESTAMP'
    },

    // Fixture 2: Journal of Open Publishing
    // @see packages/model/src/fixtures/Journal.ts -> Fixture 2
    // 6
    {
        Member_journalId: 3,
        Member_userId: 3,
        Member_permissions: 'owner',
        Member_order: 1,
        Member_createdDate: 'TIMESTAMP',
        Member_updatedDate: 'TIMESTAMP'
    },
    // 7
    {
        Member_journalId: 3,
        Member_userId: 1,
        Member_permissions: 'editor',
        Member_order: 2,
        Member_createdDate: 'TIMESTAMP',
        Member_updatedDate: 'TIMESTAMP'
    },
    // 8
    {
        Member_journalId: 3,
        Member_userId: 2,
        Member_permissions: 'reviewer',
        Member_order: 3,
        Member_createdDate: 'TIMESTAMP',
        Member_updatedDate: 'TIMESTAMP'
    },
]

const journals = [
    // Fixture 1: Journal of Traditional Publishing
    // @see packges/model/src/fixtures/Journal.ts
    {
        Journal_id: 1,
        Journal_name: 'Journal of Traditional Publishing', 
        Journal_description: 'A traditional scholarly journal utilizing a closed model.',
        Journal_model: 'closed',
        Journal_createdDate: 'TIMESTAMP',
        Journal_updatedDate: 'TIMESTAMP'
    },
    // Fixture 2: Journal of Open Publishing
    // @see packges/model/src/fixtures/Journal.ts
    {
        Journal_id: 2,
        Journal_name: 'Journal of Open Publishing', 
        Journal_description: 'A scholarly journal utilizing an open model.',
        Journal_model: 'open',
        Journal_createdDate: 'TIMESTAMP',
        Journal_updatedDate: 'TIMESTAMP'

    },
    // Fixture 3: Journal of Public Publishing
    // @see packges/model/src/fixtures/Journal.ts
    {
        Journal_id: 3,
        Journal_name: 'Journal of Public Publishing',
        Journal_description: 'A scholarly journal utilizing a public model.',
        Journal_model: 'public',
        Journal_createdDate: 'TIMESTAMP',
        Journal_updatedDate: 'TIMESTAMP'
    }

]

const journalRows = [
    // Fixture 1
    { ...journals[0], ...journal_members[0] },
    { ...journals[0], ...journal_members[1] },
    { ...journals[0], ...journal_members[2] },
    // Fixture 2
    { ...journals[1], ...journal_members[3] },
    { ...journals[1], ...journal_members[4] },
    { ...journals[1], ...journal_members[5] },
    // Fixture 3 
    { ...journals[2], ...journal_members[6] },
    { ...journals[2], ...journal_members[7] },
    { ...journals[2], ...journal_members[8] }
]

export function getJournalsTableJoinFixture(
    filter?: (element: any, index:any, array: any[]) => boolean
) {
    return getTableFixture(journalRows, filter)
}
