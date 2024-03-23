import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import PaperDAO from '../../src/daos/PaperDAO'

import { result } from '../fixtures/database/PapersTable'
import { PaperFixtures } from '@danielbingham/peerreview-model'

import { mockCore } from '../mocks/MockCore'


describe('PaperDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydratePapers()', function() {
        it('should properly interpret a QueryResultRow[] and return DatabaseResult<File>', async function() {
            const paperDAO = new PaperDAO(mockCore)
            const hydratedResults = paperDAO.hydratePapers(result.rows)

            expect(hydratedResults).toEqual(PaperFixtures.database)
        })
    })

    describe('selectPapers()', function() {
        it('should return a properly populated result set', async function() {
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(result))
            })

            const paperDAO = new PaperDAO(mockCore)
            const results = await paperDAO.selectPapers()

            expect(results).toEqual(PaperFixtures.database)
        })
    })

})
