
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
                name: 'example',
                githubIssue: '',
                migration: new ExampleMigration(database, logger, config),
                entity: null
            }
        }
    }

    async getFeature(id) {
        const entities = await this.featureDAO.selectFeatures(`WHERE features.id = $1`, [ id ])

        if ( entities.length <= 0 ) {
            return null
        }

        const entity = entities[0]

        if ( ! this.features[entity.name] ) {
            throw new ServiceError('feature-not-defined', 
                `Found Feature(${id}) in the database, by not the dictionary.`)
        }

        this.features[entity.name].entity = entity

        return this.features[entity.name]


    }

    async getAll() {
        const entities = await this.featureDAO.selectFeatures()

        for(const entity of entities) {
            if ( ! this.features[entity.name] ) {
                throw new ServiceError('missing-feature'
                    `Found Feature(${entity.id}) named ${entity.name} in the database, but not in the features dictionary.`)
            }

            this.features[entity.name].entity = entity
        }

        return this.features
    }

    async getEnabledFeatures() {
        const entities = await this.featureDAO.selectFeatures(`WHERE features.status = $1`, [ 'enabled' ])
        return entities
    }

    async initialize(name) {
        if ( ! this.features[name] ) {
            return new ServiceError('missing-feature',
                `Attempt to initialize Feature(${name}) which doesn't exist.`)
        }

        const id = await this.featureDAO.insertFeature(this.features[name])

        await this.features[name].migration.initialize()

        await this.featureDAO.updatePartialFeature({ id: id, status: 'initialized' })

        const entity = await this.featureDAO.selectFeatures('WHERE id = $1', [ id ])

        this.features[name].entity = entity

        return this.features[name]
    }



}
