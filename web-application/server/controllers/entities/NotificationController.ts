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
import { Core } from '@danielbingham/peerreview-core' 
import { NotificationDAO } from '@danielbingham/peerreview-backend'
import { User, QueryResult, EntityResult, Notification, PartialNotification } from '@danielbingham/peerreview-model'

import { ControllerError } from '../../errors/ControllerError'

export class NotificationController {
    core: Core

    notificationDAO: NotificationDAO

    constructor(core: Core) {
        this.core = core

        this.notificationDAO = new NotificationDAO(core)
    }

    async getNotifications(currentUser: User): Promise<QueryResult<Notification>> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be authenticated.
         *
         * 
         * ********************************************************************/
        
        // 1. User must be authenticated.
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated', 'Must be authenticated to retrieve notifications!')
        }

        const databaseResult = await this.notificationDAO.selectNotifications({
            where: 'user_notifications.user_id = $1', 
            params: [ currentUser.id]
        })

        const results: QueryResult<Notification> = {
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

    async patchNotification(currentUser: User, id: number, notificationPatch: PartialNotification): Promise<EntityResult<Notification>> {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be authenticated.
         *
         * 
         * ********************************************************************/
        
        // 1. User must be authenticated.
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated', 'Must be authenticated to retrieve notifications!')
        }

        notificationPatch.id = id

        const updateResult = await this.notificationDAO.updateNotification(notificationPatch)
        if ( ! updateResult ) {
            throw new ControllerError(400, 'no-content', `Failed to update a notification because no content was provided.`)
        }

        const results = await this.notificationDAO.selectNotifications({ 
            where: 'user_notifications.id = $1', 
            params: [ id ] 
        })
        const entity = results.dictionary[id]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error', `Notification(${id}) doesn't exist after update.`)
        }

        return {
            entity: entity,
            relations: {} 
        }
    }

}
