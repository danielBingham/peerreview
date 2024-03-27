import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import FieldsDAO from '../../src/daos/FieldDAO'

import { result } from '../fixtures/database/FieldsTable'
import { Field, getFieldFixture, ResultType, DatabaseResult } from '@danielbingham/peerreview-model'

import { mockCore } from '../mocks/MockCore'


describe('FieldsDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydrateField()', function() {
        it('should properly hydrate a single Field based on a single QueryResultRow', async function() {
            const fileDAO = new FieldsDAO(mockCore)
            const hydratedResult = fileDAO.hydrateField(result.rows[0])

            const fixture = getFieldFixture(ResultType.Database) as DatabaseResult<Field>
            expect(hydratedResult).toEqual(fixture.dictionary[1])
        })
    })

    describe('hydrateFields()', function() {
        it('should properly interpret a QueryResultRow[] and return DatabaseResult<Field>', async function() {
            const fileDAO = new FieldsDAO(mockCore)
            const hydratedResults = fileDAO.hydrateFields(result.rows)

            const fixture = getFieldFixture(ResultType.Database) as DatabaseResult<Field>
            expect(hydratedResults).toEqual(fixture)
        })
    })

    describe('selectFields()', function() {
        it('should return a properly populated result set', async function() {
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(result))
            })

            const fileDAO = new FieldsDAO(mockCore)
            const results = await fileDAO.selectFields()

            const fixture = getFieldFixture(ResultType.Database) as DatabaseResult<Field>
            expect(results).toEqual(fixture)
        })
    })

})
