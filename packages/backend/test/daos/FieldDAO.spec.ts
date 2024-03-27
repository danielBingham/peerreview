import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import FieldsDAO from '../../src/daos/FieldDAO'

import { getFieldsTableFixture } from '../fixtures/database/FieldsTable'
import { Field, getFieldFixture, ResultType, DatabaseResult } from '@danielbingham/peerreview-model'

import { mockCore } from '../mocks/MockCore'


describe('FieldsDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydrateField()', function() {
        it('should properly hydrate a single Field based on a single QueryResultRow', async function() {
            const fileDAO = new FieldsDAO(mockCore)

            const tableFixture = getFieldsTableFixture()
            const hydratedResult = fileDAO.hydrateField(tableFixture.rows[0])

            const fixture = getFieldFixture(ResultType.Database) as DatabaseResult<Field>
            expect(hydratedResult).toEqual(fixture.dictionary[1])
        })
    })

    describe('hydrateFields()', function() {
        it('should properly interpret a QueryResultRow[] and return DatabaseResult<Field>', async function() {
            const fileDAO = new FieldsDAO(mockCore)

            const tableFixture = getFieldsTableFixture()
            const hydratedResults = fileDAO.hydrateFields(tableFixture.rows)

            const fixture = getFieldFixture(ResultType.Database) as DatabaseResult<Field>
            expect(hydratedResults).toEqual(fixture)
        })
    })

    describe('selectFields()', function() {
        it('should return a properly populated result set', async function() {
            const tableFixture = getFieldsTableFixture()
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(tableFixture))
            })

            const fileDAO = new FieldsDAO(mockCore)
            const results = await fileDAO.selectFields()

            const fixture = getFieldFixture(ResultType.Database) as DatabaseResult<Field>
            expect(results).toEqual(fixture)
        })
    })

})
