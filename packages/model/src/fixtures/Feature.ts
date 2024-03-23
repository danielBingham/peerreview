import { generateFixture, ResultType } from './generateFixture'
import { Feature, FeatureStatus, PartialFeature } from "../types/Feature"

export const features: Feature[] = [ 
    // Fixture 1 - Just created feature
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[0]
    {
        id: 'test-feature-created',
        name: 'test-feature-created',
        status: FeatureStatus.created,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 2 - feature currently being initialized
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[1]
    {
        id: 'test-feature-initializing',
        name: 'test-feature-initializing',
        status: FeatureStatus.initializing,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 3 - initialized feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[2]
    {
        id: 'test-feature-initialized',
        name: 'test-feature-initialized',
        status: FeatureStatus.initialized,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 4 - feature currently in process of migration
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[3]
    {
        id: 'test-feature-migrating',
        name: 'test-feature-migrating',
        status: FeatureStatus.migrating,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 5 - feature that finished migrating 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[4]
    {
        id: 'test-feature-migrated',
        name: 'test-feature-migrated',
        status: FeatureStatus.migrated,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 6 - enabled feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[5]
    {
        id: 'test-feature-enabled',
        name: 'test-feature-enabled',
        status: FeatureStatus.enabled,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 7 - disabled feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[6]
    {
        id: 'test-feature-disabled',
        name: 'test-feature-disabled',
        status: FeatureStatus.disabled,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 8 - feature in process of rolling back 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[7]
    {
        id: 'test-feature-rolling-back',
        name: 'test-feature-rolling-back',
        status: FeatureStatus.rollingBack,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 9 - rolled back feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[8]
    {
        id: 'test-feature-rolled-back',
        name: 'test-feature-rolled-back',
        status: FeatureStatus.rolledBack,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 10 - feature in process of uninitializing 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[9]
    {
        id: 'test-feature-uninitializing',
        name: 'test-feature-uninitializing',
        status: FeatureStatus.uninitializing,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 11 - uninitialized feature (fully rolled back) 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[10]
    {
        id: 'test-feature-uninitialized',
        name: 'test-feature-uninitialized',
        status: FeatureStatus.uninitialized,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    }
]

export function getFeatureFixture(resultType: ResultType, filter?: (element: any, index: any, array: any[]) => boolean) {
    return generateFixture(features, resultType, filter)
}
