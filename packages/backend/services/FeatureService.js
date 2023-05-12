
const FeatureDAO = require('../daos/FeatureDAO')

const ExampleMigration = require('../migrations/ExampleMigration')
const WIPNoticeMigration = require('../migrations/WIPNoticeMigration')
const CommentVersionsMigration = require('../migrations/CommentVersionsMigration')

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

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config 

        this.featureDAO = new FeatureDAO(database, logger, config)

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
                migration: new ExampleMigration(database, logger, config)
            },
            'wip-notice': {
                migration: new WIPNoticeMigration(database, logger, config)
            },
            'comment-versions': {
                migration: new CommentVersionsMigration(database, logger, config)
            }
        }
    }

    async hasFeature(name) {
        const feature = await this.getFeature(name)

        return feature && feature.status == 'enabled'
    }

    async getFeature(name) {
        const { dictionary } = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        let feature = dictionary[name]

        if ( ! feature && this.features[name] ) {
            feature = {
                name: name,
                status: 'uncreated'
            }
        }

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
