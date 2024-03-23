import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import PaperDAO from '../../src/daos/PaperDAO'

import { getPapersTableJoinFixture } from '../fixtures/database/PapersTable'
import { Paper, getPaperFixture, ResultType, DatabaseResult } from '@danielbingham/peerreview-model'

import { mockCore } from '../mocks/MockCore'

describe('PaperDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydratePapers()', function() {
        it('should properly interpret a QueryResultRow[] and return DatabaseResult<File>', async function() {
            const paperDAO = new PaperDAO(mockCore)

            const tableFixture = getPapersTableJoinFixture()
            const hydratedResults = paperDAO.hydratePapers(tableFixture.rows)

            const fixture = getPaperFixture(ResultType.Database) as DatabaseResult<Paper>
            expect(hydratedResults).toEqual(fixture)
        })
    })

    describe('selectPapers()', function() {
        it('should return a properly populated result set', async function() {
            const tableFixture = getPapersTableJoinFixture()
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(tableFixture))
            })

            const paperDAO = new PaperDAO(mockCore)
            const results = await paperDAO.selectPapers()

            const fixture = getPaperFixture(ResultType.Database) as DatabaseResult<Paper>
            expect(results).toEqual(fixture)
        })
    })

})
