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
import express, { RequestHandler } from 'express'
import { Core } from '@danielbingham/peerreview-core' 
import { Notification, PartialNotification, QueryResult, EntityResult } from '@danielbingham/peerreview-model'

import { NotificationController } from '../../controllers/entities/NotificationController'

// RequestHandler<Request Params, Response Body, Request Body, Request Query>
export function initializeNotificationRoutes(core: Core, router: express.Router) {
    const notificationController = new NotificationController(core)

    const getNotifications: RequestHandler<{}, QueryResult<Notification>, {}, {}> = function(
        req, res, next
    ) {
        notificationController.getNotifications(req.session.user)
        .then(function(results) {
            res.status(200).json(results)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.get('/notifications', getNotifications)

    const patchNotification: RequestHandler<
        { id: number }, 
        EntityResult<Notification>, 
        PartialNotification,
        {}
    > = function(
        req, res, next
    ) {
        notificationController.patchNotification(req.session.user, req.params.id, req.body)
        .then(function(results) {
            res.status(200).json(results)
        })
        .catch(function(error) {
            next(error)
        })
    }
    router.patch('/notification/:id', patchNotification)

}
