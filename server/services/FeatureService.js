
const FeatureDAO = require('../daos/FeatureDAO')

const ExampleMigration = require('../migrations/ExampleMigration')

const ServiceError = require('../errors/ServiceError')


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
            }
        }
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

        await this.features[name].migration.initialize()

        await this.updateFeatureStatus(name, 'initialized')
    }

    async migrate(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'migrating')

        await this.features[name].migration.up()

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

        await this.features[name].migration.down()

        await this.updateFeatureStatus(name, 'rolled-back')
    }

    async uninitialize(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        await this.updateFeatureStatus(name, 'uninitializing')

        await this.features[name].migration.uninitialize()

        await this.updateFeatureStatus(name, 'uninitialized')
    }


}
