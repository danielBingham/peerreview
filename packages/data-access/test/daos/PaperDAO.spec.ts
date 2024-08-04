import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import { PaperDAO }  from '../../src/daos/PaperDAO'

import { getPapersTableJoinFixture } from '../../src/fixtures/database/PapersTable'
import { getDAOResultFixture } from '../../src/fixtures/getDAOResultFixture'

import { Paper, getPaperFixture } from '@journalhub/model'

import { mockCore } from '@journalhub/core'

describe('PaperDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydratePapers()', function() {
        it('should properly interpret a QueryResultRow[] and return DAOResult<File>', async function() {
            const paperDAO = new PaperDAO(mockCore)

            const tableFixture = getPapersTableJoinFixture()
            const hydratedResults = paperDAO.hydratePapers(tableFixture.rows)

            const fixture = getDAOResultFixture<Paper>(getPaperFixture())
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

            const fixture = getDAOResultFixture<Paper>(getPaperFixture())
            expect(results).toEqual(fixture)
        })
    })

})
