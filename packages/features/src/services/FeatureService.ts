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

import { Feature, FeatureStatus, FeatureDictionary } from '../types/Feature'
import { Core } from '@journalhub/core'

import { FeatureDAO } from '../daos/FeatureDAO'

import Migration from '../migrations/Migration'
import WIPNoticeMigration from '../migrations/WIPNoticeMigration'
import CommentVersionsMigration from '../migrations/CommentVersionsMigration'
import JournalsMigration from '../migrations/JournalsMigration'
import PaperEventsMigration from '../migrations/PaperEventsMigration'
import NotificationsMigration from '../migrations/NotificationsMigration'
import JournalTransparencyModelsMigration from '../migrations/JournalTransparencyModelsMigration'
import PaperEventStatusMigration from '../migrations/PaperEventStatusMigration'
import PaperTimelineCommentsMigration from '../migrations/PaperTimelineCommentsMigration'
import RolesAndPermissionsMigration from '../migrations/RolesAndPermissionsMigration'

import { FeatureError } from '../errors/FeatureError'
import MigrationError from '../errors/MigrationError'



/**
 *  A Service for managing feature flags and migrations. 
 *
 *  By necessity feature flags break the fourth wall, because they need to be
 *  referenced directly in code forks, and they'll be changed directly in code
 *  and commits. So we store them both in the database (to make it easy to link
 *  them to other entities) and in the code itself (so that they can be defined
 *  when they are created and added to the database later).
 */
export class FeatureService {

    /**  A reference to the Core giving us access to core dependencies. **/
    core: Core

    /** A reference to an instance of the Feature Data Access Object, allowing
    * us to interact with the `features` table and retrieve Feature models. **/
    featureDAO: FeatureDAO

    /** 
     * A dictionary of features with their code dependencies defined: 
     * - dependencies on other features, an array of feature names 
     * - conflicts with other features, an array of feature names
     * - migration that they depend on, a Migration instance
     ***/
    features: {
        [name: string]: {
            dependsOn: string[]
            conflictsWith: string[]
            migration: Migration
        }
    }

    /**
     * Initialize the FeatureService.
     *
     * NOTE: This is where we define available feature flags, with their
     * dependencies and conflicts, as well as their migrations in code.
     */
    constructor(core: Core) {
        this.core = core

        this.featureDAO = new FeatureDAO(core)

        /**
         * A list of flags by name.
         *
         * This list is manually configured, with the database being brought
         * into sync with it by an admin user after deployment.  Features will
         * be inserted into the database when the admin hits "insert" on the
         * dashboard.
         */
        this.features = {
            'wip-notice': {
                dependsOn: [],
                conflictsWith: [],
                migration: new WIPNoticeMigration(core)
            },

            // Issue #171 - Comment Versioning and Editing.
            'review-comment-versions-171': {
                dependsOn: [],
                conflictsWith: [],
                migration: new CommentVersionsMigration(core)
            },

            // Issue #79 - Journals
            'journals-79': {
                dependsOn: [],
                conflictsWith: [],
                migration: new JournalsMigration(core)
            },

            // Issue #189 - Paper Events
            'paper-events-189': {
                dependsOn: [ 'journals-79' ],
                conflictsWith: [],
                migration: new PaperEventsMigration(core)
            },


            // Issue #75 - Notification System
            'notification-system-75': {
                dependsOn: [],
                conflictsWith: [],
                migration: new NotificationsMigration(core)
            },

            // Issue #194 - Journal Permission Model
            'journal-permission-models-194': {
                dependsOn: [ 'paper-events-189', 'journals-79' ],
                conflictsWith: [],
                migration: new JournalTransparencyModelsMigration(core)
            },

            // Issue #215 - Paper Events in Progress
            'paper-event-status-215': {
                dependsOn: [ 'paper-events-189', 'journals-79' ],
                conflictsWith: [],
                migration: new PaperEventStatusMigration(core)
            },

            // Issue #190 - Paper timeline comments
            'paper-timeline-comments-190': {
                dependsOn: [ 'paper-events-189', 'paper-event-status-215', 'journal-permissions-models-194' ],
                conflictsWith: [],
                migration: new PaperTimelineCommentsMigration(core)
            },

            // #Issue #49 - Anonymity and Permissions
            '49-anonymity-and-permissions': {
                dependsOn: [ 'paper-events-189', 'journal-permissions-models-194', 'paper-timeline-comments-189' ],
                conflictsWith: [],
                migration: new RolesAndPermissionsMigration(core)
            }
        }
    }

    /**
     * Get feature flags for a user.  These are flags that the user has
     * permission to see and which can be shared with the frontend.
     *
     * NOTE: We're skipping the DAO here because we only need the name and the
     * status and none of the rest of the metadata.  We want to keep this
     * pretty efficient, since it's called on every request, so we're going
     * straight to the database and just getting exactly what we need.
     */
    async getEnabledFeatures(): Promise<FeatureDictionary> {
        const results = await this.core.database.query(`
            SELECT name, status FROM features WHERE status = $1
        `, [ 'enabled' ])

        const features: FeatureDictionary = {}
        for (const row of results.rows) {
            features[row.name] = {
                name: row.name,
                status: row.status
            }
        }

        return features
    }

    /**
     * Get a single feature with its current status. Used in contexts where we
     * need the feature's full metadata.
     *
     * @param {string} name The name of the feature we want to get.
     *
     * @return {Promise<Feature|null>} A Promise that resolves to the requested
     * Feature or null if the feature doesn't exist.
     */
    async getFeature(name: string): Promise<Feature|null> {
        const dictionary = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        let feature: Feature
        if ( ! ( name in dictionary) && name in this.features) {
            feature = {
                name: name,
                status: FeatureStatus.uncreated
            }
        } else if ( name in dictionary ) {
            feature = dictionary[name]
        } else {
            return null
        }

        feature.conflictsWith = this.features[name].conflictsWith
        feature.dependsOn = this.features[name].dependsOn

        return feature 
    }

    /**
     * Update a feature's status in the `features` table of the database.
     *
     * @param {string} name     The name of the feature we want to update.
     * @param {FeatureStatus} status    The new status to assign to that
     * feature.
     *
     * @return {Promise<void>}
     */
    async updateFeatureStatus(name: string, status: FeatureStatus): Promise<void> {
        await this.featureDAO.updatePartialFeature({ name: name, status: status })
    }

    /**
     * Insert a feature into the database. The feature must exist in the
     * Features Dictionary. This creates the feature and is the first step in
     * running its migrations and enabling it.
     *
     * @param {string} name     The name of the feature to insert into the database.
     *
     * @throws {FeatureError}   When the given `name` isn't a key of the
     * Features Dictionary.
     * @throws {FeatureError}   When attempting to insert a feature already inserted.
     * @throws {DAOError}       If something goes awry when inserting the feature.
     *
     * @return {Promise<void>}
     */
    async insert(name: string): Promise<void> {
        const feature = await this.getFeature(name)
        if ( ! feature ) {
            throw new FeatureError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        if ( feature.status !== FeatureStatus.uncreated ) {
            throw new FeatureError('invalid-status',
               `Attempt to insert Feature(${name}) which is already inserted.`)
        }

        await this.featureDAO.insertFeature({ name: name, status: FeatureStatus.created })
    }

    /**
     * Initializes a feature.
     *
     * Runs the `initialize` stage of a feature's migration, which should
     * create tables or alter tables as needed to set up the feature without
     * actually migrating any data.
     *
     * @param {string} name     The name of the feature we'd like to initialize.
     *
     * @throws {FeatureError}   When `name` doesn't exist in the Features
     * Dictionary.
     * @throws {MigrationError} When the migration fails with a MigrationError.
     * @throws {Error} If other errors occur.
     *
     * @return {Promise<void>}
     */
    async initialize(name: string): Promise<void> {
        const feature = await this.getFeature(name)
        if ( ! feature ) {
            throw new FeatureError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        if ( feature.status !== FeatureStatus.created && feature.status !== FeatureStatus.uninitialized) {
            throw new FeatureError('invalid-status',
                `Attempt to initialize Feature(${name}) currently in invalid status "${feature.status}".`)
        }

        await this.updateFeatureStatus(name, FeatureStatus.initializing)

        try {
            await this.features[name].migration.initialize()
        } catch (error) {
            // If we get a migration error and the status is 'rolled-back',
            // that means the migration was safely able to catch its own error
            // and rollback.  The database is in a known state.
            //
            // We want to throw the error to log the bug and we'll need to fix
            // the bug and redeploy, but we don't need to do database surgery.
            //
            // If the error isn't a MigrationError, or the status isn't
            // 'rolled-back', then the database is in an unknown state.  Leave
            // it the feature in 'initializing', we're going to need to do
            // surgery and we can update the status of the feature as part of
            // that effort.
            //
            // Hopefully the latter never happens.
            if ( error instanceof MigrationError && error.status == 'rolled-back' ) {
                await this.updateFeatureStatus(name, FeatureStatus.created)
            }
            throw error
        }

        await this.updateFeatureStatus(name, FeatureStatus.initialized)
    }

    /**
     * Run the migration.
     *
     * Runs the `up` stage of the feature's migration. This should migrate the
     * data. Feature must have already been inserted and initialized.
     *
     * @param {string} name     The name of the feature to migrate.
     *
     * @throws {FeatureError}   When the feature isn't in the Feature
     * Dictionary.
     * @throws {MigrationError} When the mgiration fails in a catchable way.
     * @throws {Error}          When something else goes wrong.
     *
     * @return {Promise<void>}
     */
    async migrate(name:string ): Promise<void> {
        const feature = await this.getFeature(name)
        if ( ! feature ) {
            throw new FeatureError('missing-feature',
                `Attempt to migrate Feature(${name}) which doesn't exist.`)
        }

        if ( feature.status !== FeatureStatus.initialized  && feature.status !== FeatureStatus.rolledBack) {
            throw new FeatureError('invalid-status',
                `Attempt to migrate Feature(${name}) in invalid status "${feature.status}".`)
        }

        await this.updateFeatureStatus(name, FeatureStatus.migrating)

        try {
            await this.features[name].migration.up()
        } catch (error) {
            // See comment on initialize()
            if ( error instanceof MigrationError && error.status == 'rolled-back') {
                await this.updateFeatureStatus(name, FeatureStatus.initialized)
            }
            throw error
        }

        await this.updateFeatureStatus(name, FeatureStatus.migrated)
    }

    /**
     * Enable the feature.
     *
     * Feature must have already been created, initialized, and migrated. This
     * will turn the feature on and make it usable.
     *
     * @param {string} name     The name of the feature we want to enable.
     *
     * @throws {FeatureError}   When `name` doesn't exist in Feature Dictionary.
     * @throws {FeatureError}   When the named feature isn't already migrated
     * or previously disabled.
     * @throws {DAOError}       If something goes awry updating the `features`
     * table.
     *
     * @return {Promise<void>}
     */
    async enable(name: string): Promise<void> {
        const feature = await this.getFeature(name)
        if ( ! feature ) {
            throw new FeatureError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        if ( feature.status !== FeatureStatus.migrated  
            && feature.status !== FeatureStatus.disabled) 
        {
            throw new FeatureError('invalid-status',
                `Attempt to enable Feature(${name}) in invalid status "${feature.status}".`)
        }

        await this.updateFeatureStatus(name, FeatureStatus.enabled)
    }

    /**
     * Disable the feature.
     *
     * Feature must be enabled.  This will turn the feature off and make it
     * unusable without rolling it back in anyway.
     *
     * @param {string} name     The name of the feature to disable.
     *
     * @throws {FeatureError}   When the feature doesn't exist in the Feature
     * Dictionary.
     * @throws {FeatureError}   When the feature isn't enabled.
     * @throws {DAOError}       When something goes awry while updating the
     * `features` table.
     *
     * @return {Promise<void>}
     */
    async disable(name: string): Promise<void> {
        const feature = await this.getFeature(name)
        if ( ! feature ) {
            throw new FeatureError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        if ( feature.status !== FeatureStatus.enabled ) {
            throw new FeatureError('invalid-status',
                `Attempt to disable Feature(${name}) in invalid status "${feature.status}".`)
        }

        await this.updateFeatureStatus(name, FeatureStatus.disabled)
    }

    /**
     * Rollback the feature's migration.
     *
     * Feature must be migrated or disabled.  This will run the migrations
     * `down` method, rolling it back.
     *
     * @param {string} name     The name of the feature to rollback.
     * 
     * @throws {FeatureError}   When the feature doesn't exist in the Features
     * Dictionary.
     * @throws {FeatureError}   When the feature isn't migrated or disabled.
     * @throws {MigrationError} When something goes awry with the migration.
     */
    async rollback(name: string): Promise<void> {
        const feature = await this.getFeature(name)
        if ( ! feature ) {
            throw new FeatureError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        if ( feature.status !== FeatureStatus.migrated && feature.status !== FeatureStatus.disabled) {
            throw new FeatureError('invalid-status',
                `Attempt to rollback Feature(${name}) in invalid status "${feature.status}".`)
        }

        await this.updateFeatureStatus(name, FeatureStatus.rollingBack)

        try {
            await this.features[name].migration.down()
        } catch (error) {
            // See comment on initialize()
            if ( error instanceof MigrationError && error.status == 'rolled-back') {
                await this.updateFeatureStatus(name, FeatureStatus.disabled)
            }
            throw error
        }

        await this.updateFeatureStatus(name, FeatureStatus.rolledBack)
    }

    async uninitialize(name: string): Promise<void> {
        if ( ! this.features[name] ) {
            throw new FeatureError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, FeatureStatus.uninitializing)

        try {
            await this.features[name].migration.uninitialize()
        } catch (error) {
            // See comment on initialize()
            if ( error instanceof MigrationError && error.status == 'rolled-back') {
                await this.updateFeatureStatus(name, FeatureStatus.initialized)
            }
            throw error
        }

        await this.updateFeatureStatus(name, FeatureStatus.uninitialized)
    }


}
