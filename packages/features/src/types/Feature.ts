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
/** 
 * Valid values for `Feature.status`. Represents where the Feature is in the
 * migration and activation process.
 */
export enum FeatureStatus {
    uncreated = 'uncreated',
    created = 'created', /* the feature's row has been inserted into the databse table */
    initializing = 'initializing',
    initialized = 'initialized', /* the feature has been initialized */
    migrating = 'migrating', /* the feature's data migration is being run */
    migrated = 'migrated', /* the feature's data has been successfully migrated */
    enabled = 'enabled',
    disabled = 'disabled',
    rollingBack = 'rolling-back', 
    rolledBack = 'rolled-back', 
    uninitializing = 'uninitializing',
    uninitialized = 'uninitialized'
}

/**
 * Represents a feature flag attached to a database migration.  The migration
 * information is stored in `FeatureService`.  This model contains information
 * about the status of the migration and the associated feature flag.
 *
 * @see `packages/backend/src/services/FeatureService.js`
 */
export interface Feature {

    /**
     * The name of the feature.  Should be named for a branch in Git. Also
     * double as the `id` of the model in this case.
     */
    name: string

    /**
     * The status of the Feature.
     */
    status: FeatureStatus 

    /**
     * Timestamp for the time the feature was created in the database. 
     */
    createdDate?: string

    /**
     * Timestamp for the last time the feature was updated in the database.
     */
    updatedDate?: string

    /**
     * An array of Feature.name that conflict with this feature.  Features that
     * conflict cannot both be enabled at the same time.
     */
    conflictsWith?: string[]

    /**
     * An array of Feature.name that this feature depends on.  These features
     * must be enabled before this feature can be enabled.
     */
    dependsOn?: string[]
}

/**
 * A partial Feature containing the information that can be updated from the
 * frontend.
 */
export interface PartialFeature {
    name: string
    status: string
}

/**
 * A feature specific dictionary because features are referenced by names
 * rather than integer id numbers like the rest of the Models.
 */
export interface FeatureDictionary {
    [name: string]: Feature
}
