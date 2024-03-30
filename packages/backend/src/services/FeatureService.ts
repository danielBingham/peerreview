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

import { Feature, FeatureStatus, FeatureDictionary } from '@danielbingham/peerreview-model'
import FeatureDAO from '../daos/FeatureDAO'

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

import ServiceError from '../errors/ServiceError'
import MigrationError from '../errors/MigrationError'

import Core from '../core'


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
     * @return {Promise<Feature>} A Promise that resolves to the requested
     * Feature.
     */
    async getFeature(name: string): Promise<Feature> {
        const dictionary = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        let feature = dictionary[name]

        if ( ! feature && this.features[name] ) {
            feature = {
                name: name,
                status: FeatureStatus.uncreated
            }
        } 

        feature.conflictsWith = this.features[name].conflictsWith
        feature.dependsOn = this.features[name].dependsOn

        return feature 
    }

    async updateFeatureStatus(name: string, status: FeatureStatus): Promise<void> {
        await this.featureDAO.updatePartialFeature({ name: name, status: status })
    }

    async insert(name: string): Promise<void> {
        if ( ! this.features[name] ) {
            throw new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.featureDAO.insertFeature({ name: name, status: FeatureStatus.created })
    }

    async initialize(name: string): Promise<void> {
        if ( ! this.features[name] ) {
            throw new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
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

    async migrate(name:string ): Promise<void> {
        if ( ! this.features[name] ) {
            throw new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'migrating')

        try {
            await this.features[name].migration.up()
        } catch (error) {
            // See comment on initialize()
            if ( error instanceof MigrationError && error.status == 'rolled-back') {
                await this.updateFeatureStatus(name, 'initialized')
            }
            throw error
        }

        await this.updateFeatureStatus(name, 'migrated')
    }

    async enable(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'enabled')
    }

    async disable(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'disabled')
    }

    async rollback(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'rolling-back')

        try {
            await this.features[name].migration.down()
        } catch (error) {
            // See comment on initialize()
            if ( error instanceof MigrationError && error.status == 'rolled-back') {
                await this.updateFeatureStatus(name, 'disabled')
            }
            throw error
        }

        await this.updateFeatureStatus(name, 'rolled-back')
    }

    async uninitialize(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'uninitializing')

        try {
            await this.features[name].migration.uninitialize()
        } catch (error) {
            // See comment on initialize()
            if ( error instanceof MigrationError && error.status == 'rolled-back') {
                await this.updateFeatureStatus(name, 'initialized')
            }
            throw error
        }

        await this.updateFeatureStatus(name, 'uninitialized')
    }


}
