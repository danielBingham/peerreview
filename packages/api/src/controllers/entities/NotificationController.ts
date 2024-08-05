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
import { Core } from '@journalhub/core' 
import { DataAccess } from '@journalhub/data-access'
import { User, Notification, PartialNotification } from '@journalhub/model'

import { APIError } from '../../errors/APIError'
import { APIQueryResult, APIEntityResult } from '../../types/APIResult'

export class NotificationController {
    core: Core
    dao: DataAccess

    constructor(core: Core, dao: DataAccess) {
        this.core = core
        this.dao = dao
    }

    async getNotifications(currentUser: User): Promise<APIQueryResult<Notification>> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be authenticated.
         *
         * 
         * ********************************************************************/
        
        // 1. User must be authenticated.
        if ( ! currentUser ) {
            throw new APIError(401, 'not-authenticated', 'Must be authenticated to retrieve notifications!')
        }

        const databaseResult = await this.dao.notification.selectNotifications({
            where: 'user_notifications.user_id = $1', 
            params: [ currentUser.id]
        })

        const results: APIQueryResult<Notification> = {
            dictionary: databaseResult.dictionary,
            list: databaseResult.list,
            meta: {
                count: databaseResult.list.length,
                page: 1,
                numberOfPages: 1,
                pageSize: databaseResult.list.length
            },
            relations: {}
        }

        return results
    }

    async patchNotification(
        currentUser: User, id: number, notificationPatch: PartialNotification
    ): Promise<APIEntityResult<Notification>> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be authenticated.
         *
         * 
         * ********************************************************************/
        
        // 1. User must be authenticated.
        if ( ! currentUser ) {
            throw new APIError(401, 'not-authenticated', 'Must be authenticated to retrieve notifications!')
        }

        notificationPatch.id = id

        const updateResult = await this.dao.notification.updateNotification(notificationPatch)
        if ( ! updateResult ) {
            throw new APIError(400, 'no-content', `Failed to update a notification because no content was provided.`)
        }

        const results = await this.dao.notification.selectNotifications({ 
            where: 'user_notifications.id = $1', 
            params: [ id ] 
        })
        const entity = results.dictionary[id]
        if ( ! entity ) {
            throw new APIError(500, 'server-error', `Notification(${id}) doesn't exist after update.`)
        }

        return {
            entity: entity,
            relations: {} 
        }
    }

}
