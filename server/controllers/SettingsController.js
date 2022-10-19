
const SettingsDAO = require('../daos/settings')

const ControllerError = require('../errors/ControllerError')

module.exports = class SettingsController {

    constructor(database, logger, config) {
        this.database = database
        this.logger = logger
        this.settingsDAO = new SettingsDAO(database, logger, config)
    }

    /**
     * GET /user/:user_id/settings
     *
     * Retrieve the settings stored in the database for a particular user.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.user_id The id of the user who's settings we
     * wish to retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getSettings(request, response) {
        const userId = request.params.user_id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Users may only retrieve their own settings.
         * 
         * **********************************************************/
        
        // 1. User must be logged in.
        if ( ! request.session.user ) {
            throw ControllerError(401, 'not-authenticated',
                `Unauthenticated user attempting to retrieve settings for User(${$userId}).`)
        }

        // 2. Users may only retrieve their own settings.
        if ( ! request.session.user.id == userId ) {
            throw ControllerError(403, 'not-authorized',
                `User(${request.session.user.id}) attempting to retrieve settings for User(${userId}).`)
        }

        const settings = await this.settingsDAO.selectSettings('WHERE user_settings.user_id = $1', [ userId ])
        return response.status(200).json(settings)
    }

    /**
     * POST /user/:user_id/settings
     * POST /settings
     *
     * Create settings for a user.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.user_id  (Optional) The of the user who's setting we're
     * creating.  If left out, setting will be placed on the session.
     * @param {Object}  request.body    The setting.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postSettings(request, response) {
        if ( request.params.user_id ) {
            // POST /user/:user_id/settings
            // This is used to update settings for a user who is logged in.
           
            /*************************************************************
             * Permissions Checking and Input Validation
             *
             * Permissions:
             *
             * 1. User must be logged in.
             * 2. Users may only update their own settings.
             *
             * Validation:
             *
             * 1. Setting.userId must equal :user_id
             * 
             * **********************************************************/
            const userId = request.params.user_id
            const setting = request.body
            
            // Pemissions: 1. User must be logged in.
            if ( ! request.session.user ) {
                throw new ControllerError(401, 'not-authenticated',
                    `Unauthenticated attempt to update the settings of User(${userId}).`)
            }

            // Permissions: 2. Users may only update their own settings.
            if ( request.session.user.id != userId ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${request.session.user.id}) attempted to update the settings of User(${userId}).`)
            }

            // 1. Validation: Setting.userId must equal :user_id
            if ( setting.userId != userId ) {
                throw new ControllerError(400, 'bad-data:userId',
                    `User(${request.session.user.id}) submitted setting for User(${setting.userId}) on endpoint for User(${userId}).`)
            }

            await this.settingsDAO.insertSetting(setting)

            const resultSettings= await this.settingsDAO.selectSettings('WHERE user_settings.id = $1', [ setting.id ])
            if ( resultSettings.length <= 0) {
                throw new ControllerError(500, 'server-error', 
                    `Failed to find setting ${setting.id} after insertion!`)
            }
            response.status(500).json(resultSettings[0])
        } else {
            // POST /settings
            // This is used to update settings for a user who is not logged in.
            
            /*************************************************************
             * Permissions Checking and Input Validation
             *
             * No permissions, we're just putting these settings into the
             * session.
             * 
             * **********************************************************/
            /*
             * @TODO TECHDEBT - We're not validating the settings in any way right now.
             * We need to be validating them and only accepting valid values.
             */
            const setting = request.body
            if ( setting ) {
                request.session.settings = setting
            }

            return response.status(200).json(request.session.settings)
        }

    }

    /**
     * GET /user/:user_id/setting/:id
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The id of the setting we wish to
     * retrieve.
     * @param {int} request.params.user_id The id of the user who's settings we
     * wish to retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getSetting(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Users may only retrieve their own settings.
         * 2a. :user_id must equal session.user.id
         * 2b. :user_id must equal setting.userId
         * 
         * **********************************************************/
        const id = request.params.id
        const userId = request.params.user_id

        // Pemissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Unauthenticated attempt to update the settings of User(${userId}).`)
        }

        // Permissions: 2a. Users may only retrieve their own settings.
        // :user_id must equal session.user.id
        if ( request.session.user.id != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${request.session.user.id}) attempted to update the settings of User(${userId}).`)
        }

        const settings = await this.settingsDAO.selectSettings('WHERE user_settings.id = $1', [ id ])

        if ( settings.length <= 0) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to retrieve Setting(${id}) failed.`)
        }

        const setting = settings[0]

        // Permissions: 2b. Users may only retrieve their own settings.
        // :user_id must equal setting.userId
        if ( setting.userId != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempted to retrieve setting for User(${setting.userId}).`)
        }

        return response.status(200).json(setting)
    }


    /**
     * PUT /user/:user_id/setting/:id
     *
     * Replace a Setting wholesale.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The of setting we wish to replace.
     * @param {int} request.params.user_id The id of the user who's settings we
     * wish to replace.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async putSetting(request, response) {
        const id = request.params.id
        const userId = request.params.user_id

        const setting = request.body

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Users may only replace their own settings.
         * 2a. :user_id must equal request.session.user.id
         * 2b. :user_id must equal request.body.userId
         * 2c. setting.userId must equal :user_id
         *
         * Validation:
         *
         * 1. request.body.id must equal :id
         * 2. Setting(:id) must exist.
         * 
         * **********************************************************/
        
        // Permissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Unauthenticated user attempting to replace Setting(${id}).`)
        }

        // Permissions: 2.  Users may only replace their own settings.
        // 2a. :user_id must equal request.session.user.id
        if ( request.session.user.id != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${request.session.user.id}) attempting to replace Setting(${id}) for User(${userId}).`)
        }

        // Permissions: 2.  Users may only replace their own settings.
        // 2b. :user_id must equal request.body.userId
        if ( setting.userId != userId ) {
            throw new ControllerError(400, 'bad-data:userId',
                `Setting(${id}) replacement submitted with User(${setting.userId}) instead of User(${userId}).`)
        }

        // Validation: 1.  request.body.id must equal :id
        if ( setting.id != id ) {
            throw new ControllerError(400, 'bad-data:id',
                `Setting(${id}) submitted with different id ${setting.id}.`)
        }

        const existingSettings = await this.settingsDAO.selectSettings(`WHERE user_settings.id = $1`, [ setting.id ])

        // Validation: 2. Setting(:id) must exist.
        if ( existingSettings.length <= 0 ) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to replace Setting(${id}) that doesn't exist.`)
        }

        // Permissions 2. Users may only replace their own settings.
        // 2c. setting.userId must equal :user_id
        if ( existingSettings[0].userId != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempted to replace Setting(${id}) owned by User(${existingSettings[0].userId}).`)
        }

        await this.settingsDAO.updateSetting(setting)

        const returnSettings = await this.settingsDAO.selectSettings('WHERE user_settings.id = $1', [ setting.id ])

        if ( returnSettings.length <= 0) {
            throw new Error(`Found no settings after updating setting ${setting.id}.`)
        }

        response.status(200).json(returnSettings[0])
    }
    /**
     * PATCH /user/:user_id/setting/:id
     *
     * Update a setting from a patch.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id The id of the setting we wish to update.
     * @param {int} request.params.user_id The id of the user who's settings we
     * wish to update.
     * @param {Object} request.body The setting patch we wish to use to update
     * Setting(:id).
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchSetting(request, response) {
        const id = request.params.id
        const userId = request.params.user_id

        const setting = request.body

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Users may only replace their own settings.
         * 2a. :user_id must equal request.session.user.id
         * 2b. :user_id must equal request.body.userId
         * 2c. setting.userId must equal :user_id
         *
         * Validation:
         *
         * 1. request.body.id must equal :id
         * 2. Setting(:id) must exist.
         * 
         * **********************************************************/

        // Permissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Unauthenticated user attempting to update Setting(${id}).`)
        }

        // Permissions: 2.  Users may only replace their own settings.
        // 2a. :user_id must equal request.session.user.id
        if ( request.session.user.id != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${request.session.user.id}) attempting to update Setting(${id}) for User(${userId}).`)
        }

        // Permissions: 2.  Users may only replace their own settings.
        // 2b. :user_id must equal request.body.userId
        if ( setting.userId != userId ) {
            throw new ControllerError(400, 'bad-data:userId',
                `Setting(${id}) update submitted with User(${setting.userId}) instead of User(${userId}).`)
        }

        // Validation: 1.  request.body.id must equal :id
        if ( setting.id != id ) {
            throw new ControllerError(400, 'bad-data:id',
                `Setting(${id}) submitted with different id ${setting.id}.`)
        }

        const existingSettings = await this.settingsDAO.selectSettings(`WHERE user_settings.id = $1`, [ setting.id ])

        // Validation: 2. Setting(:id) must exist.
        if ( existingSettings.length <= 0 ) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to update Setting(${id}) that doesn't exist.`)
        }

        // Permissions 2. Users may only replace their own settings.
        // 2c. setting.userId must equal :user_id
        if ( existingSettings[0].userId != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempted to update Setting(${id}) owned by User(${existingSettings[0].userId}).`)
        }

        await this.settingsDAO.updatePartialSetting(setting)

        const returnSettings = await this.settingsDAO.selectSettings('WHERE user_settings.id = $1', [ setting.id ])

        if ( returnSettings.length <= 0) {
            throw new Error(`Found no settings after updating setting ${setting.id}.`)
        }

        response.status(200).json(returnSettings[0])
    }

    /**
     * DELETE /user/:user_id/setting/:id
     *
     * NOT IMPLEMENTED
     *
     * Intentionally left unimplemented, because we don't actually want anyone
     * deleting settings.  We assume the setting row exists once the user
     * exists.  Instead, use PATCH or PUT to update the values of individual
     * settings.
     */
    async deleteSetting(request, response) {
        const id = request.params.id
        const userId = request.params.user_id

        throw new ControllerError(501, 'not-implemented',
            `User(${request.session.user?.id}) attempted to delete Setting(${id}) owned by User(${userId}).`)

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be logged in.
         * 2. Users may only delete their own settings.
         * 2a. :user_id must equal request.session.user.id
         * 2c. setting.userId must equal :user_id
         *
         * Validation:
         *
         * 1. Setting(:id) must exist.
         * 
         * **********************************************************

        // Permissions: 1. User must be logged in.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated',
                `Unauthenticated user attempting to delete Setting(${id}).`)
        }

        // Permissions: 2.  Users may only delete their own settings.
        // 2a. :user_id must equal request.session.user.id
        if ( request.session.user.id != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${request.session.user.id}) attempting to delete Setting(${id}) for User(${userId}).`)
        }


        // Validation: 1.  request.body.id must equal :id
        if ( setting.id != id ) {
            throw new ControllerError(400, 'bad-data:id',
                `Setting(${id}) submitted with different id ${setting.id}.`)
        }

        const existingSettings = await this.settingsDAO.selectSettings(`WHERE user_settings.id = $1`, [ setting.id ])

        // Validation: 2. Setting(:id) must exist.
        if ( existingSettings.length <= 0 ) {
            throw new ControllerError(404, 'no-resource',
                `Attempt to delete Setting(${id}) that doesn't exist.`)
        }

        // Permissions 2. Users may only delete their own settings.
        // 2c. setting.userId must equal :user_id
        if ( existingSettings[0].userId != userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${userId}) attempted to delete Setting(${id}) owned by User(${existingSettings[0].userId}).`)
        }

        await this.settingsDAO.deleteSetting(id)

        response.status(200).json({id: id})*/

    }


}
