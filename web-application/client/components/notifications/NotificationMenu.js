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

import { BellIcon } from '@heroicons/react/24/outline'

import { 
    FloatingMenu,
    FloatingMenuHeader,
    FloatingMenuTrigger,
    FloatingMenuBody
} from '/components/generic/floating-menu/FloatingMenu'

import { getNotifications, patchNotifications, cleanupRequest } from '/state/notifications'

import NotificationMenuItem from './NotificationMenuItem'

import './NotificationMenu.css'

const NotificationMenu = function({ }) {

    // ============ Request Tracking ==========================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.notifications.dictionary[requestId]
        } else {
            return null
        }
    })

    const [ markReadRequestId, setMarkReadRequestId ] = useState(null)
    const markReadRequest = useSelector(function(state) {
        if ( markReadRequestId ) {
            return state.notifications.dictionary[markReadRequestId]
        } else {
            return null
        }
    })

    // ============ Redux State ===============================================

    const notifications = useSelector(function(state) {
        if ( state.notifications.queries['NotificationMenu'] ) {
            return state.notifications.queries['NotificationMenu'].list
        }
        return [] 
    })

    const unreadNotifications = useSelector(function(state) {
        const unreadList = []
        for(const id of notifications) {
            if ( ! state.notifications.dictionary[id].isRead ) {
                unreadList.push(state.notifications.dictionary[id])
            }
        }
        return unreadList
    })

    // ============ Helpers and Actions =======================================

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const markAllRead = function(event) {
        event.preventDefault()
        
        const notifications = []
        for(const notification of unreadNotifications) {
            notifications.push({
                ...notification,
                isRead: true
            })
        }

        setMarkReadRequestId(dispatch(patchNotifications(notifications)))  
    }



    // ============ Effect Handling ===========================================

    useEffect(function() {
        setRequestId(dispatch(getNotifications('NotificationMenu')))
    }, [])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [requestId])

    useEffect(function() {
        return function cleanup() {
            if ( markReadRequestId ) {
                dispatch(cleanupRequest({ requestId: markReadRequestId }))
            }
        }
    }, [ markReadRequestId ])

    // ============ Render ====================================================

    let notificationViews = []
    for(const id of notifications) {
        notificationViews.push(
            <NotificationMenuItem key={id} notificationId={id} />
        )
    }
    if ( notificationViews.length == 0 ) {
        notificationViews =  ( 
            <div className="empty-list">
                No notifications.
            </div>
        )
    }


    const unread = unreadNotifications.length
    return (
        <FloatingMenu className="notification-menu">
            <FloatingMenuTrigger className="notification-trigger" showArrow={false} >
                <BellIcon />
                { unread > 0 && <div className="unread-indicator">{unread}</div> }
            </FloatingMenuTrigger>
            <FloatingMenuBody className="notification-body">
                <div className="notification-header">
                    <span className="mark-read"><a href="" onClick={(e) =>  markAllRead(e) }>Mark All Read</a></span>
                </div>
                { notificationViews }
            </FloatingMenuBody>
        </FloatingMenu>
    )

}

export default NotificationMenu
