
const DAOError = require('../errors/DAOError')

module.exports = class SettingsDAO {

    constructor(database, logger) {
        this.database = database
        this.logger = logger
    }

    async initializeSettingsForUser(user) {
        const setting = {
            userId: user.id,
            welcomeDismissed: false,
            fields: []
        }
        await this.insertSetting(setting)
    }

    hydrateSettings(rows) {
        const settings = {}
        const list = []
        for(const row of rows) {
            const setting = {
                id: row.setting_id,
                userId: row.setting_userId,
                welcomeDismissed: row.setting_welcomeDismissed,
                fundingDismissed: row.setting_fundingDismissed,
                createdDate: row.setting_createdDate,
                updatedDate: row.setting_updatedDate,
                fields: []
            }

            if ( ! settings[row.setting_id] ) {
                settings[row.setting_id] = setting
                list.push(setting)
            }

            const field = {
                fieldId: row.field_id,
                setting: row.field_setting
            }

            if ( field.fieldId && ! settings[row.setting_id].fields.find((f) => f.fieldId == field.fieldId) ) {
                settings[row.setting_id].fields.push(field)
            }
        }

        return list 
    }

    async selectSettings(where, params) {
        if ( ! where ) {
            where = ''
        } 

        if ( ! params ) {
            params = []
        }

        const sql = `
            SELECT 
                user_settings.id as setting_id, user_settings.user_id as "setting_userId", 
                user_settings.welcome_dismissed as "setting_welcomeDismissed", 
                user_settings.funding_dismissed as "setting_fundingDismissed", 
                user_settings.created_date as "setting_createdDate", user_settings.updated_date as "setting_updatedDate",
                user_field_settings.field_id as "field_id", user_field_settings.setting as "field_setting"
            FROM user_settings
                LEFT OUTER JOIN user_field_settings ON user_settings.id = user_field_settings.setting_id
            ${where}
        `

        const results = await this.database.query(sql, params)

        if ( results.rows.length == 0) {
            return [] 
        }
        return this.hydrateSettings(results.rows)
    }

    /**
     * Insert a single fieldSetting, linking it to the setting identified by `settingId`.
     *
     * @param {int} settingId   The setting.id we'd like to link this fieldSetting to.
     * @param {object} fieldSetting The field setting we're insert into the database.
     *
     * @throws {Error}  When no rows are inserted.
     * @returns {void}
     */
    async insertFieldSetting(settingId, fieldSetting) {
        const results = await this.database.query(`
            INSERT INTO user_field_settings (setting_id, field_id, setting)
                VALUES ($1, $2, $3)
        `, [ settingId, fieldSetting.fieldId, fieldSetting.setting ])

        if ( results.rowCount == 0) {
            throw new Error(`Something went wrong while inserting field setting for setting ${settingId} and field ${fieldSetting.fieldId}.`)
        }
    }

    async insertSetting(setting) {
        const results = await this.database.query(`
            INSERT INTO user_settings (user_id, welcome_dismissed, funding_dismissed, created_date, updated_date)
                VALUES ($1, $2, $3, now(), now())
                RETURNING id
        `, [ setting.userId, setting.welcomeDismissed, setting.fundingDismissed ])

        if ( results.rowCount == 0 ) {
            throw new DAOError('insertion-failure', `Something went wrong while inserting setting ${setting.id}.`)
        }

        setting.id = results.rows[0].id

        if ( setting.fields ) {
            for ( const fieldSetting of setting.fields ) {
                await this.insertFieldSetting(setting.id, fieldSetting)
            }
        }

        return results.rows[0].id
    }


    /**
     *
     */
    async updateSetting(setting) {
        const results = await this.database.query(`
            UPDATE user_settings SET
                user_id = $1,
                welcome_dismissed = $2,
                funding_dismissed = $3,
                updated_date = now()
            WHERE id = $4
        `, [ setting.userId, setting.welcomeDismissed, setting.fundingDismissed, setting.id ])

        if ( results.rowCount == 0) {
            throw new Error(`Failed to update setting ${setting.id}.  May not exist.`)
        }

        const deleteResults = await this.database.query(`
            DELETE FROM user_field_settings WHERE setting_id = $1
        `, [ setting.id ])

        if ( setting.fields && setting.fields.length > 0) {
            for ( const fieldSetting of setting.fields ) {
                await this.insertFieldSetting(setting.id, fieldSetting)
            }
        }
    }

    /**
     * Update a setting in the database from a parial `settings` object.
     *
     * @param {Object} setting  A settings object that only has some of its
     * fields set.  `id` MUST be set.
     * 
     * @throws {Error} When no Id is included or when no rows are updated.
     * @returns {void}
     */
    async updatePartialSetting(setting) {
        if ( ! setting.id ) {
            throw new Error(`Can't update a setting with out an Id.`)
        }

        let sql = 'UPDATE user_settings SET '
        let params = []
        let count = 1
        const ignored = [ 'id', 'userId', 'createdDate', 'updatedDate' ] 
        for(let key in setting) {
            if (ignored.includes(key)) {
                continue
            }

            if ( key == 'welcomeDismissed' ) {
                sql += `welcome_dismissed = $${count}, `
            } else if ( key == 'fundingDismissed' ) {
                sql += `funding_dismissed = $${count}, `
            } else {
                sql += `${key} = $${count}, `
            }


            params.push(setting[key])
            count = count + 1
        }
        sql += 'updated_date = now() WHERE id = $' + count
        params.push(setting.id)

        const results = await this.database.query(sql, params)

        if ( results.rowCount <= 0) {
            throw new Error(`Failed to update user_settings ${setting.id}.`)
        }
    }

    /**
     * Delete a setting from the database.
     *
     * @param {int} settingId   The setting.id of the setting you want to delete.
     * 
     * @throws {Error}  When no settings are deleted.
     * @returns {void}
     */
    async deleteSetting(settingId) {
        const results = await this.database.query(`
            DELETE FROM user_settings WHERE id=$1
        `, [ settingId ])

        if ( results.rowCount <= 0 ) {
            throw new Error(`Failed to delete a setting with id ${settingId}`)
        }
    }
}
