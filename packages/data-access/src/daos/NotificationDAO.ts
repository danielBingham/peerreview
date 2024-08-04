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
import { Pool, Client, QueryResultRow } from 'pg'

import { Core, DAOError } from '@journalhub/core'

import { Notification, PartialNotification, ModelDictionary } from '@journalhub/model'

import { DAOQuery, DAOQueryOrder, DAOResult } from '../types/DAO'

/**
 * Data Access Object for the `user_notificiations` table and associated
 * Notification type. 
 */
export class NotificationDAO {
    core: Core
    database: Pool|Client

    constructor(core: Core, database?: Pool|Client) {
        this.core = core
        this.database = core.database

        if ( database ) {
            this.database = database
        }
    }

    /**
     * Get the SELECT portion of an SQL SELECT statement used to select the
     * fields needed to hydrate a Notification model.
     */
    getNotificationSelectionString(): string {
        return `
        user_notifications.id as "Notification_id",
        user_notifications.user_id as "Notification_userId",
        user_notifications.type as "Notification_type",
        user_notifications.description as "Notification_description",
        user_notifications.path as "Notification_path",
        user_notifications.is_read as "Notification_isRead",
        user_notifications.created_date as "Notification_createdDate",
        user_notifications.updated_date as "Notification_updatedDate"
        `
    }

    /**
     * Hydrate a single `Notification` model from a single QueryResultRow that
     * contains the fields selected using `getNotificationSelectionString()`.
     * May contain additional fields, which will be ignored.
     */
    hydrateNotification(row: QueryResultRow): Notification {
        return {
            id: row.Notification_id,
            userId: row.Notification_userId,
            type: row.Notification_type,
            description: row.Notification_description,
            path: row.Notification_path,
            isRead: row.Notification_isRead,
            createdDate: row.Notification_createdDate,
            updatedDate: row.Notification_updatedDate
        }
    }

    /** 
     * Hydrate a Notification models from an array of QueryResultRows returned
     * from a query made using  `getNotificationSelectionString()`.  Rows may
     * contain other columns, which will be ignored.
     */
    hydrateNotifications(rows: QueryResultRow[]): DAOResult<Notification> {
        const dictionary: ModelDictionary<Notification> = {}
        const list: number[] = []

        for(const row of rows ) {
            const notification = this.hydrateNotification(row) 
            if ( ! dictionary[notification.id] ) {
                dictionary[notification.id] = notification
                list.push(notification.id)
            }
        }

        return { dictionary: dictionary, list: list } 
    }

    /**
     * Select `Notification` models from the database using the DAOQuery
     * defined in `query`.
     */
    async selectNotifications(query?: DAOQuery): Promise<DAOResult<Notification>> {
        const where = query?.where || ''
        const params = query?.params || []

        let order = 'user_notifications.created_date desc'
        if ( query?.order == DAOQueryOrder.Newest ) {
            order = 'user_notifications.created_date desc'
        } else if ( query?.order == DAOQueryOrder.Oldest ) {
            order = 'user_notifications.created_date asc'
        }

        const page = query?.page || 1
        const itemsPerPage = query?.itemsPerPage || 20

        const sql = `
            SELECT 
                ${this.getNotificationSelectionString()}
            FROM user_notifications
            ${where}
            ORDER BY ${order} 
            LIMIT ${itemsPerPage}
            OFFSET ${( itemsPerPage * (page-1))}
        `

        const results = await this.database.query(sql, params)

        return this.hydrateNotifications(results.rows)
    }

    /**
     * Insert a row into the `user_notifications` table using a
     * PartialNotification. Returns a Promise that resolves to the primary key
     * id of the newly inserted row.
     */
    async insertNotification(notification: PartialNotification): Promise<number> {
        const results = await this.database.query(`
            INSERT INTO user_notifications 
                ( user_id, description, path, type, is_read, created_date )
            VALUES
                ( $1, $2, $3, $4, false, now() )
            RETURNING id
        `, [ notification.userId, notification.description, notification.path, notification.type ])

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('insert-failed', `Attempt to insert notification failed.`)
        }

        return results.rows[0].id
    }

    /**
     * Update a notification with the data defined in `PartialNotification`.
     *
     * The `PartialNotification` _must_ include the Notification.id.
     */
    async updateNotification(notification: PartialNotification): Promise<boolean> {
        if ( ! ( "id" in notification)) {
            throw new DAOError('missing-id', 'Attempt to update a notification with out an id.')
        }

        if ( notification.isRead == false || notification.isRead == true ) {
            const results = await this.database.query(`
                UPDATE user_notifications SET is_read = $1, updated_date = now() WHERE id = $2
            `, [ notification.isRead, notification.id ])

            if ( ! results.rowCount || results.rowCount <= 0 ) {
                throw new DAOError('updated-failed', `Attempt to update notification failed.`)
            }

            return true
        } else {
            return false
        }
    }

    /**
     * Delete a notification identified by `id` from the `user_notifications`
     * table.
     */
    async deleteNotification(id: number): Promise<void> {
        const results = await this.database.query(`
            DELETE FROM user_notifications WHERE id = $1
        `, [ id ] )

        if ( ! results.rowCount || results.rowCount <= 0 ) {
            throw new DAOError('delete-failed', 'Attempt to delete a notification failed.')
        }
    }
}
