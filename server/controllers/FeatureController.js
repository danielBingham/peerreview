const FeatureService = require('../services/FeatureService')
const FeatureDAO = require('../daos/FeatureDAO')

const ControllerError = require('../errors/ControllerError')

module.exports = class FeatureController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.featureService = new FeatureService(database, logger, config)
        this.featureDAO = new FeatureDAO(database, logger, config)
    }

    /**
     * If the user is an admin, give them the full list of features.
     * If the user is not an admin, only give them the features that are enabled.
     *
     * @param {Object} request  Standard express request object.
     * @param {Object} response Standard express response object.
     */
    async getFeatures(request, response) {
        let results = {}

        // If the user is an admin, they get the full list, including features
        // that haven't been initialized yet.  Those features only exist in
        // code, so we'll need to walk the list, check the dictionary that we
        // get from the database, add any that are missing.
        if (request.session?.user?.permissions == 'admin' || request.session?.user?.permissions == 'superadmin') {
            results = await this.featureDAO.selectFeatures()

            for ( const name in this.featureService.features ) {
                 if ( ! results.dictionary[name] ) {
                    results.dictionary[name] = {
                        name: name,
                        status: 'uncreated'
                    }
                }
            }
            
        } else {
             results = await this.featureDAO.selectFeatures(`WHERE status = $1`, [ 'enabled' ])
        }

        console.log(results.dictionary)

        return response.status(200).json(results.dictionary)
    }

    /**
     * Initialize the feature.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.body.name  The name of the feature we want to initialize.  Defined in FeatureService
     * @param {Object} response Standard Express response object.
     */
    async postFeatures(request, response) {
        // Must be logged in to initialize a feature.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Attempt to initialize a feature from a non-authenticated user.`)
        }

        if ( request.session.user.permissions != 'admin' && request.session.user.permissions != 'superadmin' ) {
            throw new ControllerError(403, 'not-authorized',
                `Attempt to initialize a feature from a non-admin user.`)
        }

        const name = request.body.name

        if ( ! name ) {
            throw new ControllerError(400, 'missing-input',
                `Attempt to initialize unnamed feature.`)
        }

        if ( ! this.featureService.features[name] ) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to initialize Feature(${name}) that doesn't exist.`)
        }

        const existing = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        if ( existing.list.length > 0 ) {
            throw new ControllerError(400, 'already-inserted',
                `Attempt to insert Feature(${name}) that is already inserted.`)
        }

        await this.featureService.insert(name)

        const { dictionary } = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        if ( ! dictionary[name] ) {
            throw new ControllerError(500, 'server-error'
                `Can't find Feature(${name}) after insertion.`)
        }

        return response.status(200).json(dictionary[name])
    }

    /**
     * If they are an admin, give them the feature.  If they are a user, only
     * give it to them if its enabled.
     *
     * @param {Object} request  Standard Express request object.
     * @param {String} request.params.name    The name of the feature we want to get.
     */
    async getFeature(request, response) {
        const name = request.params.name
        const { dictionary } = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        if ( ! dictionary[name] ) {
            throw new ControllerError(404, 'no-resource',
                `Failed to find Feature(${request.params.id}).`)
        }

        const feature = dictionary[name]

        // If the feature is enabled, then we don't care who's asking.
        if ( feature.status == 'enabled' ) {
            return response.status(200).json(feature)
        }

        // Otherwise, they have to be logged in and an admin.
        if ( ! request.session.user ) {
            throw new ControllerError(404, 'no-resource',
                `Unauthenticated user attempt to access non-enabled Feature(${name}).`)
        }

        if ( request.session.user.permissions != 'admin' && request.session.user.permissions != 'superadmin') {
            throw new ControllerError(404, 'no-resource',
                `Non-admin User(${request.session.user.id}) attempting to access Feature(${name}).`)
        }

        return response.status(200).json(feature)
    }

    /**
     * Updates to the `status` field of a feature trigger the appropriate migrations.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.params.name  The name of the feature.
     * @param {string} request.body.status  The desired status for this feature.
     * @param {Object} response The started Express response object.
     */
    async patchFeature(request, response) {
        if ( ! request.session.user ) {
            throw new ControllerError(404, 'no-resource',
                `Unauthenticated user attempt to access non-enabled Feature(${request.params.id}).`)
        }

        if ( request.session.user.permissions != 'admin' && request.session.user.permissions != 'superadmin') {
            throw new ControllerError(404, 'no-resource',
                `Non-admin attempting to access Feature(${request.params.id}).`)
        }

        const status = request.body.status

        const name = request.params.name
        const { dictionary } = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        if ( ! dictionary[name] ) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to update Feature(${request.params.id}) that doesn't exist.`)
        }

        const feature = dictionary[name]

        if ( feature.status == 'migrating' || feature.status == 'rolling-back' 
            || feature.status == 'initializing' || feature.status == 'uninitializing' ) 
        {
            throw new ControllerError(400, 'in-progress',
                `Attempt to change status of Feature(${request.params.id}) which is currently ${feature.status}.`)
        }

        // We'll need to take different actions depending on the state we're in
        // and the state we're going for.

        if ( feature.status == 'created' ) {
            if ( status == 'initialized' ) {
                await this.featureService.initialize(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }
        }

        else if ( feature.status == 'initialized') {
            if ( status == 'migrated' ) {
                await this.featureService.migrate(feature.name)
            } 

            else if ( status == 'enabled' ) {
                await this.featureService.migrate(feature.name)
                await this.featureService.enable(feature.name)
            }

            else if ( status == 'uninitialized' ) {
                await this.featureService.uninitialize(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }
        }

        else if ( feature.status == 'migrated' ) { 
            if ( status == 'enabled' ) {
                await this.featureService.enable(feature.name)
            }

            else if ( status == 'rolled-back' ) {
                await this.featureService.rollback(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)

            }
        }

        else if ( feature.status == 'enabled' ) {
            if ( status == 'disabled' ) {
                await this.featureService.disable(feature.name)
            }

            else if ( status == 'rolled-back' ) {
                await this.featureService.rollback(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)

            }
        }

        else if ( feature.status == 'disabled') {
            if ( status == 'enabled' ) {
                await this.featureService.enable(feature.name)
            }

            else if ( status == 'rolled-back' ) {
                await this.featureService.rollback(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }

        }

        else if ( feature.status == 'rolled-back' ) {
            if ( status == 'migrated' ) {
                await this.featureService.migrate(feature.name)
            }

            else if ( status == 'enabled' ) {
                await this.featureService.migrate(feature.name)
                await this.featureService.enable(feature.name)
            }

            else if ( status == 'uninitialized' ) {
                await this.featureService.uninitialize(name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }

        }

        else if ( feature.status == 'uninitialized') {
            if ( status == 'initialized' ) {
                await this.featureService.initialize(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }
        }



        const  after = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        if ( ! after.dictionary[name]) {
            throw new ControllerError(500, 'server-error',
                `Failed to find Feature(${name}) after updating status.`)
        }

        return response.status(200).json(after.dictionary[name])
    }

}
