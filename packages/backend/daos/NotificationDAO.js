/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
const DAOError = require('../errors/DAOError')

module.exports = class NotificationsDAO {

    constructor(core, database) {
        this.core = core
        this.database = core.database

        if ( database ) {
            this.database = database
        }
    }

    hydrateNotifications(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows ) {
            const notification = {
                id: row.notification_id,
                userId: row.notification_userId,
                type: row.notification_type,
                description: row.notification_description,
                path: row.notification_path,
                isRead: row.notification_isRead,
                createdDate: row.notification_createdDate,
                updatedDate: row.notification_updatedDate
            }

            if ( ! dictionary[notification.id] ) {
                dictionary[notification.id] = notification
                list.push(notification.id)
            }
        }

        return { dictionary: dictionary, list: list } 
    }

    async selectNotifications(where, params) {
        where = where || ''
        params = params || []

        const sql = `
            SELECT 
                id as notification_id,
                user_id as "notification_userId",
                type as "notification_type",
                description as notification_description,
                path as notification_path,
                is_read as "notification_isRead",
                created_date as "notification_createdDate",
                updated_date as "notification_updatedDate"
            FROM user_notifications
            ${where}
            ORDER BY created_date desc
        `

        const results = await this.database.query(sql, params)

        return this.hydrateNotifications(results.rows)
    }

    async insertNotification(notification) {
        const results = await this.database.query(`
            INSERT INTO user_notifications 
                ( user_id, description, path, type, is_read, created_date )
            VALUES
                ( $1, $2, $3, $4, false, now() )
            RETURNING id
        `, [ notification.userId, notification.description, notification.path, notification.type ])

        if ( results.rowCount <= 0 ) {
            throw new DAOError('insert-failed', `Attempt to insert notification failed.`)
        }

        return results.rows[0].id
    }

    async updateNotification(notification) {
        if ( notification.isRead == false || notification.isRead == true ) {
            const results = await this.database.query(`
                UPDATE user_notifications SET is_read = $1, updated_date = now() WHERE user_id = $2
            `, [ notification.isRead, notification.userId ])

            if ( results.rowCount <= 0 ) {
                throw new DAOError('updated-failed', `Attempt to update notification failed.`)
            }

            return true
        } else {
            return false
        }
    }

    async deleteNotification(id) {
        const results = await this.database.query(`
            DELETE FROM user_notifications WHERE id = $1
        `, [ id ] )

        if ( results.rowCount <= 0 ) {
            throw new DAOError('delete-failed', 'Attempt to delete a notification failed.')
        }
    }
}
