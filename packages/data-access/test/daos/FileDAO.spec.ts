import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import { FileDAO } from '../../src/daos/FileDAO'
import { DAOResult } from '../../src/types/DAO'

import { getFilesTableFixture } from '../../src/fixtures/database/FilesTable'
import { File, getFileFixture, ResultType } from '@journalhub/model'

import { mockCore } from '@journalhub/core'


describe('FilesDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydrateFile()', function() {
        it('should properly hydrate a single File based on a single QueryResultRow', async function() {
            const fileDAO = new FileDAO(mockCore)


            const tableFixture = getFilesTableFixture()
            const hydratedResult = fileDAO.hydrateFile(tableFixture.rows[0])

            const fixture = getFileFixture(ResultType.Database) as DAOResult<File>
            expect(hydratedResult).toEqual(fixture.dictionary[1])
        })
    })

    describe('hydrateFiles()', function() {
        it('should properly interpret a QueryResultRow[] and return DAOResult<File>', async function() {
            const fileDAO = new FileDAO(mockCore)

            const tableFixture = getFilesTableFixture()
            const hydratedResults = fileDAO.hydrateFiles(tableFixture.rows)

            const fixture = getFileFixture(ResultType.Database) as DAOResult<File>
            expect(hydratedResults).toEqual(fixture)
        })
    })

    describe('selectFiles()', function() {
        it('should return a properly populated result set', async function() {
            const tableFixture = getFilesTableFixture()
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(tableFixture))
            })

            const fileDAO = new FileDAO(mockCore)

            const results = await fileDAO.selectFiles()

            const fixture = getFileFixture(ResultType.Database) as DAOResult<File>
            expect(results).toEqual(fixture)
        })
    })

})