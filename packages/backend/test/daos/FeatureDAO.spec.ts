import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryResult } from 'pg'

import FeatureDAO from '../../src/daos/FeatureDAO'

import { result } from '../fixtures/database/FeaturesTable'
import { FeatureFixtures } from '@danielbingham/peerreview-model'

import { mockCore } from '../mocks/MockCore'


describe('FeaturesDAO', function() {

    beforeEach(function() {
        mockCore.database.query.mockReset()
    })

    describe('hydrateFeature()', function() {
        it('should properly hydrate a single Feature based on a single QueryResultRow', async function() {
            const featureDAO = new FeatureDAO(mockCore)
            const hydratedResult = featureDAO.hydrateFeature(result.rows[0])

            expect(hydratedResult).toEqual(FeatureFixtures.database.dictionary['test-feature-created'])
        })
    })

    describe('hydrateFeatures()', function() {
        it('should properly interpret a QueryResultRow[] and return DatabaseResult<Feature>', async function() {
            const featureDAO = new FeatureDAO(mockCore)
            const hydratedResults = featureDAO.hydrateFeatures(result.rows)

            expect(hydratedResults).toEqual(FeatureFixtures.database)
        })
    })

    describe('selectFeatures()', function() {
        it('should return a properly populated result set', async function() {
            mockCore.database.query.mockImplementation(function() {
                return new Promise<QueryResult>(resolve => resolve(result))
            })

            const featureDAO = new FeatureDAO(mockCore)
            const results = await featureDAO.selectFeatures()

            expect(results).toEqual(FeatureFixtures.database)
        })
    })

})
