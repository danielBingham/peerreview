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

import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import JournalsDAO from '../../src/daos/JournalDAO'

import { getJournalsTableJoinFixture } from '../../src/fixtures/database/JournalsTable'
import { Journal, getJournalFixture, ResultType, DatabaseResult } from '@danielbingham/peerreview-model'

import { mockCore } from '@danielbingham/peerreview-core'


describe('JournalsDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
        mockCore.features.features['journal-permission-models-194'] = true 
    })

    describe('hydrateJournal()', function() {
        it('should properly hydrate a single Journal based on a single QueryResultRow', async function() {
            const journalDAO = new JournalsDAO(mockCore)

            const tableFixture = getJournalsTableJoinFixture()
            const hydratedResult = journalDAO.hydrateJournal(tableFixture.rows[0])

            const fixture = getJournalFixture(ResultType.Database) as DatabaseResult<Journal>
            fixture.dictionary[1].members = []

            expect(hydratedResult).toEqual(fixture.dictionary[1])
        })
    })

    describe('hydrateJournals()', function() {
        it('should properly interpret a QueryResultRow[] and return DatabaseResult<Journal>', async function() {
            const journalDAO = new JournalsDAO(mockCore)

            const tableFixture = getJournalsTableJoinFixture()
            const hydratedResults = journalDAO.hydrateJournals(tableFixture.rows)

            const fixture = getJournalFixture(ResultType.Database) as DatabaseResult<Journal>
            expect(hydratedResults).toEqual(fixture)
        })
    })

    describe('selectJournals()', function() {
        it('should return a properly populated result set', async function() {
            const tableFixture = getJournalsTableJoinFixture()
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(tableFixture))
            })

            const fileDAO = new JournalsDAO(mockCore)

            const results = await fileDAO.selectJournals()

            const fixture = getJournalFixture(ResultType.Database) as DatabaseResult<Journal>
            expect(results).toEqual(fixture)
        })
    })

})