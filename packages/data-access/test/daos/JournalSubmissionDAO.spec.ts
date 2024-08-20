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

import { JournalSubmissionDAO } from '../../src/daos/JournalSubmissionDAO'

import { getJournalSubmissionsTableJoinFixture } from '../../src/fixtures/database/JournalSubmissionsTable'
import { getDAOResultFixture } from '../../src/fixtures/getDAOResultFixture'

import { JournalSubmission, getJournalSubmissionFixture } from '@journalhub/model'
import { FeatureStatus } from '@journalhub/features'

import { mockCore } from '@journalhub/core'


describe('JournalSubmissionDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
        mockCore.features.features['journal-permission-models-194'] = {
            name: 'journal-permission-models-194',
            status: FeatureStatus.enabled
        }
    })

    describe('hydrateJournalSubmission()', function() {
        it('should properly hydrate a single JournalSubmission based on a single QueryResultRow', async function() {
            const journalSubmissionDAO = new JournalSubmissionDAO(mockCore)

            const tableFixture = getJournalSubmissionsTableJoinFixture()
            const hydratedResult = journalSubmissionDAO.hydrateJournalSubmission(tableFixture.rows[0])

            const fixture = getDAOResultFixture<JournalSubmission>(getJournalSubmissionFixture())
            fixture.dictionary[1].reviewers = []
            fixture.dictionary[1].editors = []

            expect(hydratedResult).toEqual(fixture.dictionary[1])
        })
    })

    describe('hydrateJournalSubmissions()', function() {
        it('should properly interpret a QueryResultRow[] and return DAOResult<JournalSubmission>', async function() {
            const journalSubmissionDAO = new JournalSubmissionDAO(mockCore)

            const tableFixture = getJournalSubmissionsTableJoinFixture()
            const hydratedResults = journalSubmissionDAO.hydrateJournalSubmissions(tableFixture.rows)

            const fixture = getDAOResultFixture<JournalSubmission>(getJournalSubmissionFixture())
            expect(hydratedResults).toEqual(fixture)
        })
    })

    describe('selectJournalSubmissions()', function() {
        it('should return a properly populated result set', async function() {
            const tableFixture = getJournalSubmissionsTableJoinFixture()
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(tableFixture))
            })

            const journalSubmissionDAO = new JournalSubmissionDAO(mockCore)

            const results = await journalSubmissionDAO.selectJournalSubmissions()

            const fixture = getDAOResultFixture<JournalSubmission>(getJournalSubmissionFixture())
            expect(results).toEqual(fixture)
        })
    })

})
