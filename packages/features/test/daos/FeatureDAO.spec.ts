import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import { FeatureDAO } from '../../src/daos/FeatureDAO'
import { getFeatureFixture } from '../../src/fixtures/entity/Feature'

import { getFeaturesTableFixture } from '../../src/fixtures/database/FeaturesTable'

import { mockCore } from '@danielbingham/peerreview-core'

describe('FeaturesDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydrateFeature()', function() {
        it('should properly hydrate a single Feature based on a single QueryResultRow', async function() {
            const featureDAO = new FeatureDAO(mockCore)
        
            const tableFixture = getFeaturesTableFixture()
            const hydratedResult = featureDAO.hydrateFeature(tableFixture.rows[0])

            const fixture = getFeatureFixture() 
            expect(hydratedResult).toEqual(fixture['test-feature-created'])
        })
    })

    describe('hydrateFeatures()', function() {
        it('should properly interpret a QueryResultRow[] and return DatabaseResult<Feature>', async function() {
            const featureDAO = new FeatureDAO(mockCore)

            const tableFixture = getFeaturesTableFixture()
            const hydratedResults = featureDAO.hydrateFeatures(tableFixture.rows)

            const fixture = getFeatureFixture() 
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

            const fixture = getFeatureFixture()
            expect(results).toEqual(fixture)
        })
    })

})
