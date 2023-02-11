const backend = require('@peerreview/backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class FeatureController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.config = config

        this.featureService = new backend.FeatureService(database, logger, config)
        this.featureDAO = new backend.FeatureDAO(database, logger, config)
    }

    /**
     * If the user is an admin, give them the full list of features.
     * If the user is not an admin, only give them the features that are enabled.
     *
     * @param {Object} request  Standard express request object.
     * @param {Object} response Standard express response object.
     *
     * @return {Promise} Resolves to void.
     */
    async getFeatures(request, response) {
        let results = {}

        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * If the user is an admin, they get the full list, including features
         * that haven't been initialized yet.  Those features only exist in
         * code, so we'll need to walk the list, check the dictionary that we
         * get from the database, add any that are missing.
         *
         * 1. User is an admin => give them the full list.
         * 2. User is not an admin (or not logged in) => give them the list of
         * enabled features.
         * 
         * ********************************************************************/

        // 1. User is an admin => give them the full list.
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
        } 

        //  2. User is not an admin (or not logged in) => give them the list of
        // enabled features.
        else {
             results = await this.featureDAO.selectFeatures(`WHERE status = $1`, [ 'enabled' ])
        }

        return response.status(200).json(results.dictionary)
    }

    /**
     * Insert a feature defined in FeatureService but not yet inserted into the
     * database.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.body.name  The name of the feature we want to initialize.  Defined in FeatureService
     * @param {Object} response Standard Express response object.
     *
     * @return {Promise} Resolves to void.
     */
    async postFeatures(request, response) {

        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User must be an admin or a superadmin.
         *
         * Validation:
         *
         * 3. Request body must contain a feature :name.
         * 4. Feature(:name) must exist in FeatureService.
         * 5. Feature(:name) must not already be in the database.
         * 
         * ********************************************************************/

        // 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Attempt to initialize a feature from a non-authenticated user.`)
        }

        // 2. User must be an admin or a superadmin.
        if ( request.session.user.permissions != 'admin' && request.session.user.permissions != 'superadmin' ) {
            throw new ControllerError(403, 'not-authorized',
                `Attempt to initialize a feature from a non-admin user.`)
        }

        const name = request.body.name

        // 3. Request body must contain a feature :name.
        if ( ! name ) {
            throw new ControllerError(400, 'missing-input',
                `Attempt to initialize unnamed feature.`)
        }

        // 4. Feature(:name) must exist in FeatureService.
        if ( ! this.featureService.features[name] ) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to initialize Feature(${name}) that doesn't exist.`)
        }

        const existing = await this.featureDAO.selectFeatures(`WHERE name = $1`, [ name ])

        // 5. Feature(:name) must not already be in the database.
        if ( existing.list.length > 0 ) {
            throw new ControllerError(400, 'already-inserted',
                `Attempt to insert Feature(${name}) that is already inserted.`)
        }

        /**********************************************************************
         * Permissions and Validation complete.
         *      Insert the feature.
         **********************************************************************/

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
     *
     * @return {Promise} Resolves to void.
     */
    async getFeature(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. Feature(:name) is enabled => anyone may read it.
         * 2. Feature(:name) is not enabled => only admins and superadmins may
         * read it.
         * 
         * ********************************************************************/

        const name = request.params.name

        const feature = await this.featureService.getFeature(name)

        if ( ! feature ) {
            throw new ControllerError(404, 'no-resource',
                `Failed to find Feature(${request.params.id}).`)
        }

        // 1. Feature(:name) is enabled => anyone may read it.
        if ( feature.status == 'enabled' ) {
            return response.status(200).json(feature)
        }

        // 2. Feature(:name) is not enabled => only admins and superadmins may
        // read it.
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
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         *
         * 1. User must be logged in.
         * 2. User must be an admin or a superadmin.
         *
         * Validation:
         *
         * 3. :name must exist
         * 4. Feature(:name) must exist.
         * 5. Feature(:name) must be inserted.
         * 6. Request body must contain a `status` parameter.
         * 7. `status` must be a valid feature status.
         * 8. `status` may not be an in-progress status.
         * 
         * ********************************************************************/

        // 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(404, 'no-resource',
                `Unauthenticated user attempt to access non-enabled Feature(${request.params.id}).`)
        }

        // 2. User must be an admin or a superadmin.
        if ( request.session.user.permissions != 'admin' && request.session.user.permissions != 'superadmin') {
            throw new ControllerError(404, 'no-resource',
                `Non-admin attempting to access Feature(${request.params.id}).`)
        }

        const name = request.params.name

        // 3. :name must exist
        if ( ! name ) {
            throw new ControllerError(400, 'no-name',
                `Attempt to PATCH a feature with out a name.`)
        }

        const status = request.body.status

        // 6. Request body must contain a `status` parameter.
        if ( ! status ) {
            throw new ControllerError(400, 'no-status',
                `Attempt to PATCH a feature with out a status.`)
        }


        const feature = await this.featureService.getFeature(name)

        // 4. Feature(:name) must exist.
        if ( ! feature ) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to update Feature(${request.params.id}) that doesn't exist.`)
        }

        // 5. Feature(:name) must be inserted.
        if ( feature.status == 'uncreated' ) {
            throw new ControllerError(400, 'not-created',
                `User attempted to PATCH uncreated Feature(${name}).`)
        }

        const validStatuses = [
            'created', 
            'initializing',
            'initialized', 
            'migrating', 
            'migrated', 
            'enabled',
            'disabled',
            'rolling-back', 
            'rolled-back', 
            'uninitializing',
            'uninitialized'
        ]

        // 7. `status` must be a valid feature status.
        if ( ! validStatuses.includes(status) ) {
            throw new ControllerError(400, 'invalid-status',
                `Status ${status} not valid.`)
        }

        // 8. `status` may not be an in-progress status.
        if ( feature.status == 'migrating' || feature.status == 'rolling-back' 
            || feature.status == 'initializing' || feature.status == 'uninitializing' ) 
        {
            throw new ControllerError(400, 'in-progress',
                `Attempt to change status of Feature(${request.params.id}) which is currently ${feature.status}.`)
        }
        
        /**********************************************************************
         * Basic Permissions and Validation Complete.
         **********************************************************************/


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
