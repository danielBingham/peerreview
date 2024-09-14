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
const { NotificationDAO } = require('@danielbingham/peerreview-backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class NotificationController {

    constructor(core) {
        this.core = core

        this.notificationDAO = new NotificationDAO(core)
    }

    /**
     * Get notifications for the current user.
     */
    async getNotifications(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be authenticated.
         *
         * 
         * ********************************************************************/
        
        // 1. User must be authenticated.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 'Must be authenticated to retrieve notifications!')
        }

        const userId = request.session.user.id

        const results = await this.notificationDAO.selectNotifications('WHERE user_notifications.user_id = $1', [ userId ])

        results.meta = {}
        results.relations = []

        return response.status(200).json(results)
    }

    /**
     * Update a batch of notifications.
     */
    async patchNotifications(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be authenticated.
         * 2. All notifications in batch must belong to currentUser.
         *
         *********************************************************************/

        // 1. User must be authenticated.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 'Must be authenticated to retrieve notifications!')
        }

        let notifications = []
        if ( ! Array.isArray(request.body) ) {
            notifications.push(request.body)
        } else {
            notifications = request.body
        }

        for( const notification of notifications ) {
            const updateResult = await this.notificationDAO.updateNotification(notification)
            if ( ! updateResult ) {
                throw new ControllerError(400, 'no-content', `Failed to update a batch of notifications because no content was provided.`)
            }
        }

        const results = await this.notificationDAO.selectNotifications(
            'WHERE user_notifications.id = ANY($1::bigint[])', [ notifications.map((n) => n.id) ])

        results.meta = {}
        results.relations = []

        return response.status(200).json(results)
    }

    /**
     * Update a notification.
     */
    async patchNotification(request, response) {
        /**********************************************************************
         * Permissions Checking and Input Validation
         *
         * 1. User must be authenticated.
         *
         * 
         * ********************************************************************/
        
        // 1. User must be authenticated.
        if ( ! request.session.user ) {
            throw new ControllerError(401, 'not-authenticated', 'Must be authenticated to retrieve notifications!')
        }

        const id = request.params.id
        const notification = request.body

        notification.id = id

        const updateResult = await this.notificationDAO.updateNotification(notification)
        if ( ! updateResult ) {
            throw new ControllerError(400, 'no-content', `Failed to update a notification because no content was provided.`)
        }

        const results = await this.notificationDAO.selectNotifications('WHERE user_notifications.id = $1', [ id ] )
        const entity = results.dictionary[id]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error', `Notification(${id}) doesn't exist after update.`)
        }

        return response.status(200).json({
            entity: entity,
            relations: []
        })
    }

}
