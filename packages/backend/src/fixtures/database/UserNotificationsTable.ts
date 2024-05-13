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
/******************************************************************************
 * Fixtures for the `user_notifications` database table for use in tests.
 *
 * Represents the rows returned by the `SELECT` statement used in the
 * `NotificationDAO`.
 *
 * @see `user_notifications` tables in
 * `database/initialization-scripts/schema.sql`
 *
 ******************************************************************************/
import { getTableFixture } from './getTableFixture'

const user_notifications = [
    {
        Notification_id: 1,
        Notification_userId: 1,
        Notification_type: 'author:paper:submitted',
        Notification_description: 'Your co-author has submitted your paper!',
        Notification_path: '/paper/1',
        Notification_isRead: false,
        Notification_createdDate: 'TIMESTAMP',
        Notification_updatedDate: 'TIMESTAMP'
    },
    {
        Notification_id: 2,
        Notification_userId: 2,
        Notification_type: 'author:paper:submitted',
        Notification_description: 'Your co-author has submitted your paper!',
        Notification_path: '/paper/1',
        Notification_isRead: true,
        Notification_createdDate: 'TIMESTAMP',
        Notification_updatedDate: 'TIMESTAMP'
    }
]

export function getUserNotificationsTableFixture(
    filter?: (element: any, index: any, array: any[]) => boolean
) {
    return getTableFixture(user_notifications, filter)
}
