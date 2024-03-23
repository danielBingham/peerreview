import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import FeatureDAO from '../../src/daos/FeatureDAO'

import { getFeaturesTableFixture } from '../fixtures/database/FeaturesTable'
import { Feature, DatabaseResult, ResultType, getFeatureFixture } from '@danielbingham/peerreview-model'

import { mockCore } from '../mocks/MockCore'


describe('FeaturesDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydrateFeature()', function() {
        it('should properly hydrate a single Feature based on a single QueryResultRow', async function() {
            const featureDAO = new FeatureDAO(mockCore)
        
            const tableFixture = getFeaturesTableFixture()
            const hydratedResult = featureDAO.hydrateFeature(tableFixture.rows[0])

            const fixture = getFeatureFixture(ResultType.Database) as DatabaseResult<Feature>
            expect(hydratedResult).toEqual(fixture.dictionary['test-feature-created'])
        })
    })

    describe('hydrateFeatures()', function() {
        it('should properly interpret a QueryResultRow[] and return DatabaseResult<Feature>', async function() {
            const featureDAO = new FeatureDAO(mockCore)

            const tableFixture = getFeaturesTableFixture()
            const hydratedResults = featureDAO.hydrateFeatures(tableFixture.rows)

            const fixture = getFeatureFixture(ResultType.Database) as DatabaseResult<Feature>
            expect(hydratedResults).toEqual(fixture)
        })
    })

    describe('selectFeatures()', function() {
        it('should return a properly populated result set', async function() {
            const tableFixture = getFeaturesTableFixture()
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(tableFixture))
            })

            const featureDAO = new FeatureDAO(mockCore)
            const results = await featureDAO.selectFeatures()

            const fixture = getFeatureFixture(ResultType.Database) as DatabaseResult<Feature>
            expect(results).toEqual(fixture)
        })
    })

})
