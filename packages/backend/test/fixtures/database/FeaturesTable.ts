/******************************************************************************
 * Fixtures for the `features` database table for use in tests.
 *
 * Represents the rows returned by the `SELECT` statement used in the
 * `FeatureDAO`.
 *
 * @see `features` table in `database/initialization-scripts/schema.sql`
 *
 ******************************************************************************/

import { getTableFixture } from './getTableFixture'

export const features = [
    // 0
    // @see packages/model/fixtures/Features.js -> Fixture 1
    {
        Feature_name: 'test-feature-created',
        Feature_status: 'created',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },
    // 1
    // @see packages/model/fixtures/Features.js -> Fixture 2
    {
        Feature_name: 'test-feature-initializing',
        Feature_status: 'initializing',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },
    // 2
    // @see packages/model/fixtures/Features.js -> Fixture 3
    {
        Feature_name: 'test-feature-initialized',
        Feature_status: 'initialized',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },
    // 3
    // @see packages/model/fixtures/Features.js -> Fixture 4
    {
        Feature_name: 'test-feature-migrating',
        Feature_status: 'migrating',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },
    // 4
    // @see packages/model/fixtures/Features.js -> Fixture 5
    {
        Feature_name: 'test-feature-migrated',
        Feature_status: 'migrated',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },
    // 5
    // @see packages/model/fixtures/Features.js -> Fixture 6
    {
        Feature_name: 'test-feature-enabled',
        Feature_status: 'enabled',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },
    // 6
    // @see packages/model/fixtures/Features.js -> Fixture 7
    {
        Feature_name: 'test-feature-disabled',
        Feature_status: 'disabled',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },
    // 7
    // @see packages/model/fixtures/Features.js -> Fixture 8
    {
        Feature_name: 'test-feature-rolling-back',
        Feature_status: 'rolling-back',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },
    // 8
    // @see packages/model/fixtures/Features.js -> Fixture 9
    {
        Feature_name: 'test-feature-rolled-back',
        Feature_status: 'rolled-back',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },
    // 9
    // @see packages/model/fixtures/Features.js -> Fixture 10 
    {
        Feature_name: 'test-feature-uninitializing',
        Feature_status: 'uninitializing',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },
    // 10 
    // @see packages/model/fixtures/Features.js -> Fixture 11 
    {
        Feature_name: 'test-feature-uninitialized',
        Feature_status: 'uninitialized',
        Feature_createdDate: 'TIMESTAMP',
        Feature_updatedDate: 'TIMESTAMP'
    },

]

export function getFeaturesTableFixture(
    filter?: (element: any, index:any, array: any[]) => boolean
) {
    return getTableFixture(features, filter)
}
