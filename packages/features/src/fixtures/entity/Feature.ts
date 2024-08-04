/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { Feature, FeatureStatus, FeatureDictionary } from "../../types/Feature"

export const features: Feature[] = [ 
    // Fixture 1 - Just created feature
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[0]
    {
        name: 'test-feature-created',
        status: FeatureStatus.created,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 2 - feature currently being initialized
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[1]
    {
        name: 'test-feature-initializing',
        status: FeatureStatus.initializing,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 3 - initialized feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[2]
    {
        name: 'test-feature-initialized',
        status: FeatureStatus.initialized,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 4 - feature currently in process of migration
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[3]
    {
        name: 'test-feature-migrating',
        status: FeatureStatus.migrating,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 5 - feature that finished migrating 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[4]
    {
        name: 'test-feature-migrated',
        status: FeatureStatus.migrated,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 6 - enabled feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[5]
    {
        name: 'test-feature-enabled',
        status: FeatureStatus.enabled,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 7 - disabled feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[6]
    {
        name: 'test-feature-disabled',
        status: FeatureStatus.disabled,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 8 - feature in process of rolling back 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[7]
    {
        name: 'test-feature-rolling-back',
        status: FeatureStatus.rollingBack,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 9 - rolled back feature 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[8]
    {
        name: 'test-feature-rolled-back',
        status: FeatureStatus.rolledBack,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 10 - feature in process of uninitializing 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[9]
    {
        name: 'test-feature-uninitializing',
        status: FeatureStatus.uninitializing,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 11 - uninitialized feature (fully rolled back) 
    // @see packages/backend/test/fixtures/database/FeaturesTable.js -> features[10]
    {
        name: 'test-feature-uninitialized',
        status: FeatureStatus.uninitialized,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    }
]

export function getFeatureFixture(filter?: (element: any, index: any, array: any[]) => boolean): FeatureDictionary {
    let fixtureList: Feature[] = structuredClone(features)
    if ( filter ) {
        fixtureList = fixtureList.filter(filter)
    }

    const fixtureDictionary: FeatureDictionary = {}
    for(const feature of fixtureList) {
        fixtureDictionary[feature.name] = feature
    }

    return fixtureDictionary 
}
