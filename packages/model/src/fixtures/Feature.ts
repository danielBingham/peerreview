import { generateFixture, ResultType } from './generateFixture'
import { Feature, FeatureStatus, PartialFeature } from "../types/Feature"

export const features: Feature[] = [ 
    // Fixture 1 - Just created feature
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[0]
    {
        id: 1,
        name: 'test-feature-created',
        status: FeatureStatus.created,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 2 - feature currently being initialized
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[1]
    {
        id: 2,
        name: 'test-feature-initializing',
        status: FeatureStatus.initializing,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 3 - initialized feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[2]
    {
        id: 3,
        name: 'test-feature-initialized',
        status: FeatureStatus.initialized,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 4 - feature currently in process of migration
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[3]
    {
        id: 4,
        name: 'test-feature-migrating',
        status: FeatureStatus.migrating,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 5 - feature that finished migrating 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[4]
    {
        id: 5,
        name: 'test-feature-migrated',
        status: FeatureStatus.migrated,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 6 - enabled feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[5]
    {
        id: 6,
        name: 'test-feature-enabled',
        status: FeatureStatus.enabled,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 7 - disabled feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[6]
    {
        id: 7,
        name: 'test-feature-disabled',
        status: FeatureStatus.disabled,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 8 - feature in process of rolling back 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[7]
    {
        id: 8,
        name: 'test-feature-rolling-back',
        status: FeatureStatus.rollingBack,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 9 - rolled back feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[8]
    {
        id: 9,
        name: 'test-feature-rolled-back',
        status: FeatureStatus.rolledBack,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 10 - feature in process of uninitializing 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[9]
    {
        id: 10,
        name: 'test-feature-uninitializing',
        status: FeatureStatus.uninitializing,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 11 - uninitialized feature (fully rolled back) 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[10]
    {
        id: 11,
        name: 'test-feature-uninitialized',
        status: FeatureStatus.uninitialized,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    }
]

export function getFeatureFixture(resultType: ResultType, filter?: (element: any, index: any, array: any[]) => boolean) {
    return generateFixture(features, resultType, filter)
}
