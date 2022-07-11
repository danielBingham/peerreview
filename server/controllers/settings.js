
const SettingsDAO = require('../daos/settings')

module.exports = class SettingsController {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
        this.settingsDAO = new SettingsDAO(database, logger)
    }


    async getSettings(request, response) {
        try {
            const userId = request.params.user_id

            const settings = await this.settingsDAO.selectSettings('WHERE user_settings.user_id = $1', [ userId ])
            return response.status(200).json(settings)
        } catch (error) {
            this.logger.error(error)
            response.status(500).json({ error: 'server-error' })
        }
    }

    async postSettings(request, response) {
        try {
            if ( request.params.user_id ) {
                const userId = request.params.user_id
                const setting = request.body
                setting.userId = userId

                await this.settingsDAO.insertSetting(setting)

                const settings = await this.settingsDAO.selectSettings('WHERE user_settings.id = $1', [ setting.id ])
                if ( settings.length <= 0) {
                    throw new Error(`Failed to find setting ${setting.id} after insertion!`)
                }
                response.status(500).json(settings[0])
            } else {
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

        } catch(error) {
            this.logger.error(error)
            response.status(500).json({ error: 'server-error' })
        }
    }

    async getSetting(request, response) {
        try {
            const id = request.params.id
            const settings = await this.settingsDAO.selectSettings('WHERE user_settings.id = $1', [ id ])

            if ( settings.length == 0) {
                return response.status(404).json({ error: 'not-found' })
            }

            response.status(200).json(settings[0])
        } catch(error) {
            this.logger.error(error)
            response.status(500).json({error: 'server-error'})
        }
    }

    async putSetting(request, response) {
        try {
            const setting = request.body
            setting.id = request.params.id

            await this.settingsDAO.updateSetting(setting)

            const returnSettings = await this.settingsDAO.selectSettings('WHERE user_settings.id = $1', [ setting.id ])

            if ( returnSettings.length <= 0) {
                throw new Error(`Found no settings after updating setting ${setting.id}.`)
            }

            response.status(200).json(returnSettings[0])
        } catch(error) {
            this.logger.error(error)
            response.status(500).json({error: 'server-error'})
        }
    }

    async patchSetting(request, response) {
        try {
            const setting = request.body
            setting.id = request.params.id

            await this.settingsDAO.updatePartialSetting(setting)

            const returnSettings = await this.settingsDAO.selectSettings('WHERE user_settings.id = $1', [ setting.id ])

            if ( returnSettings.length <= 0) {
                throw new Error(`Found no settings after updating setting ${setting.id}.`)
            }

            response.status(200).json(returnSettings[0])
        } catch (error) {
            this.logger.error(error)
            response.status(500).json({error: 'server-error'})
        }
    }

    async deleteSetting(request, response) {
        try {
            const id = request.params.id

            await this.settingsDAO.deleteSetting(id)

            response.status(200).json({id: id})
        } catch (error) {
            this.logger.error(error)
            response.status(500).json({error: 'server-error'})
        }

    }


}
