import { DatabaseResult, QueryResult, ModelDictionary } from "../types/Results"
import { Feature, FeatureStatus, PartialFeature } from "../types/Feature"

const features: ModelDictionary<Feature> = {}

// Fixture 1 - Just created feature
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[0]
features['test-feature-created'] = {
    id: 'test-feature-created',
    name: 'test-feature-created',
    status: FeatureStatus.created,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}

// Fixture 2 - feature currently being initialized
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[1]
features['test-feature-initializing'] = {
    id: 'test-feature-initializing',
    name: 'test-feature-initializing',
    status: FeatureStatus.initializing,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}

// Fixture 3 - initialized feature 
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[2]
features['test-feature-initialized'] = {
    id: 'test-feature-initialized',
    name: 'test-feature-initialized',
    status: FeatureStatus.initialized,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}

// Fixture 4 - feature currently in process of migration
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[3]
features['test-feature-migrating'] = {
    id: 'test-feature-migrating',
    name: 'test-feature-migrating',
    status: FeatureStatus.migrating,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}

// Fixture 5 - feature that finished migrating 
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[4]
features['test-feature-migrated'] = {
    id: 'test-feature-migrated',
    name: 'test-feature-migrated',
    status: FeatureStatus.migrated,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}

// Fixture 6 - enabled feature 
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[5]
features['test-feature-enabled'] = {
    id: 'test-feature-enabled',
    name: 'test-feature-enabled',
    status: FeatureStatus.enabled,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}

// Fixture 7 - disabled feature 
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[6]
features['test-feature-disabled'] = {
    id: 'test-feature-disabled',
    name: 'test-feature-disabled',
    status: FeatureStatus.disabled,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}

// Fixture 8 - feature in process of rolling back 
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[7]
features['test-feature-rolling-back'] = {
    id: 'test-feature-rolling-back',
    name: 'test-feature-rolling-back',
    status: FeatureStatus.rollingBack,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}

// Fixture 9 - rolled back feature 
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[8]
features['test-feature-rolled-back'] = {
    id: 'test-feature-rolled-back',
    name: 'test-feature-rolled-back',
    status: FeatureStatus.rolledBack,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}

// Fixture 10 - feature in process of uninitializing 
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[9]
features['test-feature-uninitializing'] = {
    id: 'test-feature-uninitializing',
    name: 'test-feature-uninitializing',
    status: FeatureStatus.uninitializing,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}

// Fixture 11 - uninitialized feature (fully rolled back) 
// @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[10]
features['test-feature-uninitialized'] = {
    id: 'test-feature-uninitialized',
    name: 'test-feature-uninitialized',
    status: FeatureStatus.uninitialized,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
}
export const databaseResults: DatabaseResult<Feature> = {
    dictionary: features,
    list: Object.values(features)
}

export const queryResults: QueryResult<Feature> = {
    dictionary: features,
    list: Object.values(features),
    meta: {
        count: Object.keys(features).length,
        page: 1,
        pageSize: 20,
        numberOfPages: 1
    },
    relations: {}
}
