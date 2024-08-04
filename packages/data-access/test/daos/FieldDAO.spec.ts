import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import { FieldDAO } from '../../src/daos/FieldDAO'

import { getFieldsTableFixture } from '../../src/fixtures/database/FieldsTable'
import { getDAOResultFixture } from '../../src/fixtures/getDAOResultFixture'

import { Field, getFieldFixture } from '@journalhub/model'

import { mockCore } from '@journalhub/core'


describe('FieldDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydrateField()', function() {
        it('should properly hydrate a single Field based on a single QueryResultRow', async function() {
            const fileDAO = new FieldDAO(mockCore)

            const tableFixture = getFieldsTableFixture()
            const hydratedResult = fileDAO.hydrateField(tableFixture.rows[0])

            const fixture = getDAOResultFixture<Field>(getFieldFixture())

            expect(hydratedResult).toEqual(fixture.dictionary[1])
        })
    })

    describe('hydrateFields()', function() {
        it('should properly interpret a QueryResultRow[] and return DAOResult<Field>', async function() {
            const fileDAO = new FieldDAO(mockCore)

            const tableFixture = getFieldsTableFixture()
            const hydratedResults = fileDAO.hydrateFields(tableFixture.rows)

            const fixture = getDAOResultFixture<Field>(getFieldFixture())
            expect(hydratedResults).toEqual(fixture)
        })
    })

    describe('selectFields()', function() {
        it('should return a properly populated result set', async function() {
            const tableFixture = getFieldsTableFixture()
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(tableFixture))
            })

            const fileDAO = new FieldDAO(mockCore)
            const results = await fileDAO.selectFields()

            const fixture = getDAOResultFixture<Field>(getFieldFixture())
            expect(results).toEqual(fixture)
        })
    })

})
