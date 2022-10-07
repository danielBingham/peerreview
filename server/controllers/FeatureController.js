const FeatureService = require('../services/FeatureService')

const ControllerError = require('../errors/ControllerError')

module.exports = class FeatureController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.featureService = new FeatureService(database, logger, config)
    }

    /**
     * If the user is an admin, give them the full list of features.
     * If the user is not an admin, only give them the features that are enabled.
     *
     * @param {Object} request  Standard express request object.
     * @param {Object} response Standard express response object.
     */
    async getFeatures(request, response) {
        let features = {}
        if (request.session?.user?.permissions == 'admin' || request.session?.user?.permission == 'superadmin') {
            features = await this.featureService.getAll()
        } else {
            features = await this.featureService.getEnabledFeatures()
        }

        return response.status(200).json(features)
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

        if ( this.featureService.features[name].entity ) {
            throw new ControllerError(400, 'already-initialized',
                `Attempt to initialize Feature(${name}) that is already initialized.`)
        }

        const feature = await this.featureService.initialize(name)
        return response.status(200).json(feature)

    }

    /**
     * If they are an admin, give them the feature.  If they are a user, only
     * give it to them if its enabled.
     *
     * @param {Object} request  Standard Express request object.
     * @param {object} request.params.id    The database id of the feature we want to get.
     */
    async getFeature(request, response) {
        const feature = await this.featureService.getFeature(request.params.id)

        if ( ! feature ) {
            throw new ControllerError(404, 'no-resource',
                `Failed to find Feature(${request.params.id}).`)
        }

        if ( feature.entity.status == 'enabled' ) {
            return response.status(200).json(feature)
        }


        if ( ! request.session.user ) {
            throw new ControllerError(404, 'no-resource',
                `Unauthenticated user attempt to access non-enabled Feature(${request.params.id}).`)
        }

        if ( request.session.user.permissions != 'admin' && request.session.user.permissions != 'superadmin') {
            throw new ControllerError(404, 'no-resource',
                `Non-admin attempting to access Feature(${request.params.id}).`)
        }

        return response.status(200).json(feature)
    }

    /**
     * Updates to the `status` field of a feature trigger the appropriate migrations.
     *
     * @param {Object} request  Standard Express request object.
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

        const feature = this.featureService.getFeature(request.params.id)

        if ( ! feature ) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to update Feature(${request.params.id}) that doesn't exist.`)
        }

        if ( feature.status == 'created') {
            throw new ControllerError(400, 'not-initialized',
                `Attempt to PATCH an uninitialized feature.`)
        }

        if ( feature.status == 'migrating' || feature.status == 'rolling-back' ) {
            throw new ControllerError(400, 'in-progress',
                `Attempt to change status of Feature(${request.params.id}) which is currently ${feature.status}.`)
        }

        // We'll need to take different actions depending on the state we're in
        // and the state we're going for.

        if ( feature.status == 'initialized') {
            if ( status == 'migrated' ) {
                await this.featureService.migrate(feature.name)
            } 

            else if ( status == 'enabled' ) {
                await this.featureService.migrate(feature.name)
                await this.featureService.enable(feature.name)
            }

            else if ( status == 'deinitialized' ) {
                await this.featureService.deinitialize(feature.name)
            }

            else {
                throw new ControllerError(400, 'invalid-status',
                    `Attempt to move from ${feature.status} to ${status} isn't valid.`)
            }
        }

        if ( feature.status == 'migrated' || feature.status == 'enabled' || feature.status == 'disabled' ) {


        }

        if ( feature.status == 'rolled-back' ) {

        }

        if ( feature.status == 'deinitialized') {

        }


    }

}
