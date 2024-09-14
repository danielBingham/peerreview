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
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import { patchNotification, cleanupRequest } from '/state/notifications'

import './NotificationMenuItem.css'

const NotificationMenu = function({ notificationId}) {

    // ============ Request Tracking ==========================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.notifications.dictionary[requestId]
        } else {
            return null
        }
    })

    // ============ Redux State ===============================================

    const notification = useSelector(function(state) {
        return state.notifications.dictionary[notificationId]
    })

    // ============ Helpers and Actions =======================================

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const notificationClicked = function(notification) {

        if ( notification.isRead == false ) {
            const patchedNotification = { ...notification }
            patchedNotification.isRead = true

            setRequestId(dispatch(patchNotification(patchedNotification)))
        }

        navigate(notification.path)
    }

    // ============ Effect Handling ===========================================

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [requestId])


    // ============ Render ====================================================

    return (
        <FloatingMenuItem 
            onClick={(e) => notificationClicked(notification)}
            className={`notification ${notification.isRead ? 'read' : '' }`}
        >
            { notification.description }
        </FloatingMenuItem>
    )

}

export default NotificationMenu
