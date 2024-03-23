import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import FilesDAO from '../../src/daos/FileDAO'

import { result } from '../fixtures/database/FilesTable'
import { File, getFileFixture, ResultType, DatabaseResult } from '@danielbingham/peerreview-model'

import { mockCore } from '../mocks/MockCore'


describe('FilesDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydrateFile()', function() {
        it('should properly hydrate a single File based on a single QueryResultRow', async function() {
            const fileDAO = new FilesDAO(mockCore)
            const hydratedResult = fileDAO.hydrateFile(result.rows[0])

            const fixture = getFileFixture(ResultType.Database) as DatabaseResult<File>
            expect(hydratedResult).toEqual(fixture.dictionary[1])
        })
    })

    describe('hydrateFiles()', function() {
        it('should properly interpret a QueryResultRow[] and return DatabaseResult<File>', async function() {
            const fileDAO = new FilesDAO(mockCore)
            const hydratedResults = fileDAO.hydrateFiles(result.rows)

            const fixture = getFileFixture(ResultType.Database) as DatabaseResult<File>
            expect(hydratedResults).toEqual(fixture)
        })
    })

    describe('selectFiles()', function() {
        it('should return a properly populated result set', async function() {
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(result))
            })

            const fileDAO = new FilesDAO(mockCore)
            const results = await fileDAO.selectFiles()

            const fixture = getFileFixture(ResultType.Database) as DatabaseResult<File>
            expect(results).toEqual(fixture)
        })
    })

})
