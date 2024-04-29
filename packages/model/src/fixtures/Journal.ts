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

import { ResultType } from "../types/Results"
import { Journal, JournalModel, JournalMemberPermissions } from "../types/Journal"

import { generateFixture } from './generateFixture'

const journals: Journal[] = [
   // Fixture 1: Journal of Traditional Publishing
   // @see packages/backend/test/fixtures/database/JournalsTable.ts -> journals[0]
   {
      id: 1,
      name: 'Journal of Traditional Publishing',
      description: 'A traditional scholarly journal utilizing a closed model.',
      model: JournalModel.Closed,
      createdDate: 'TIMESTAMP',
      updatedDate: 'TIMESTAMP',
      members: [
         {
            journalId: 1,
            userId: 1,
            permissions: JournalMemberPermissions.Owner,
            order: 1,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
         },
         {
            journalId: 1,
            userId: 2,
            permissions: JournalMemberPermissions.Editor,
            order: 2,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
         },
         {
            journalId: 1,
            userId: 3,
            permissions: JournalMemberPermissions.Editor,
            order: 3,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
         }
      ]
   },
   // Fixture 2: Journal of Open Publishing
   // @see packages/backend/test/fixtures/database/JournalsTable.ts -> Fixture 2
   {
      id: 2,
      name: 'Journal of Open Publishing',
      description: 'A scholarly journal utilizing an open model.',
      model: JournalModel.Open,
      createdDate: 'TIMESTAMP',
      updatedDate: 'TIMESTAMP',
      members: [
         {
            journalId: 2,
            userId: 2,
            permissions: JournalMemberPermissions.Owner,
            order: 1,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
         },
         {
            journalId: 2,
            userId: 3,
            permissions: JournalMemberPermissions.Editor,
            order: 2,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
         },
         {
            journalId: 2,
            userId: 1,
            permissions: JournalMemberPermissions.Reviewer,
            order: 3,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
         }
      ]
   },
   // Fixture 3: Journal of Public Publishing
   // @see packages/backend/test/fixtures/database/JournalsTable.ts -> Fixture 3
   {
      id: 3,
      name: 'Journal of Public Publishing',
      description: 'A scholarly journal utilizing a public model.',
      model: JournalModel.Public,
      createdDate: 'TIMESTAMP',
      updatedDate: 'TIMESTAMP',
      members: [
         {
            journalId: 3,
            userId: 3,
            permissions: JournalMemberPermissions.Owner,
            order: 1,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
         },
         {
            journalId: 3,
            userId: 1,
            permissions: JournalMemberPermissions.Editor,
            order: 2,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
         },
         {
            journalId: 3,
            userId: 2,
            permissions: JournalMemberPermissions.Reviewer,
            order: 3,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP'
         }
      ]
   }
]

export function getJournalFixture(resultType: ResultType, filter?: (element: any, index: any, array: any[]) => boolean) {
    return generateFixture<Journal>(journals, resultType, filter)
}
