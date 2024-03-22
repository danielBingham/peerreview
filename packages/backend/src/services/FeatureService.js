
const FeatureDAO = require('../daos/FeatureDAO')

const ExampleMigration = require('../migrations/ExampleMigration')
const WIPNoticeMigration = require('../migrations/WIPNoticeMigration')
const CommentVersionsMigration = require('../migrations/CommentVersionsMigration')
const JournalsMigration = require('../migrations/JournalsMigration')
const PaperEventsMigration = require('../migrations/PaperEventsMigration')
const NotificationsMigration = require('../migrations/NotificationsMigration')
const JournalTransparencyModelsMigration = require('../migrations/JournalTransparencyModelsMigration')
const PaperEventStatusMigration = require('../migrations/PaperEventStatusMigration')
const PaperTimelineCommentsMigration = require('../migrations/PaperTimelineCommentsMigration')
const RolesAndPermissionsMigration = require('../migrations/RolesAndPermissionsMigration')

const ServiceError = require('../errors/ServiceError')
const MigrationError = require('../errors/MigrationError')


/**
 *  A Service for managing feature flags and migrations.  By necessity feature
 *  flags break the fourth wall, as it were, because they need to be referenced
 *  directly in code forks anyway, and they'll be changed directly in code and
 *  commits.  So we store them both in the database (to make it easy to link
 *  them to other entities) and in the code itself (so that they can be defined
 *  when they are created and needed and added to the database later).
 */
module.exports = class FeatureService {

    constructor(core) {
        this.database = core.database
        this.logger = core.logger
        this.config = core.config 

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
            'example':  {
                dependsOn: [],
                conflictsWith: [],
                migration: new ExampleMigration(core)
            },
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

            'paper-timeline-comments-190': {
                dependsOn: [ 'paper-events-189', 'paper-event-status-215', 'journal-permissions-models-194' ],
                conflictsWith: [],
                migration: new PaperTimelineCommentsMigration(core)
            },

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
     *
     * @param {User}    user    An instance of a populated `User` object.
     */
    async getEnabledFeatures() {
        const results = await this.database.query(`
            SELECT name, status FROM features WHERE status = $1
        `, [ 'enabled' ])

        const features = {}
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
     */
    async getFeature(name) {
        const { dictionary } = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        let feature = dictionary[name]

        if ( ! feature && this.features[name] ) {
            feature = {
                name: name,
                status: 'uncreated'
            }
        } 

        feature.conflictsWith = this.features[name].conflictsWith
        feature.dependsOn = this.features[name].dependsOn

        return feature 
    }

    async updateFeatureStatus(name, status) {
        await this.featureDAO.updatePartialFeature({ name: name, status: status })
    }

    async insert(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.featureDAO.insertFeature({ name: name })
    }

    async initialize(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'initializing')

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
                await this.updateFeatureStatus(name, 'created')
            }
            throw error
        }

        await this.updateFeatureStatus(name, 'initialized')
    }

    async migrate(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
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
