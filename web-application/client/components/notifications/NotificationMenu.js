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

import { getNotifications, cleanupRequest } from '/state/notifications'

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
                { notificationViews }
            </FloatingMenuBody>
        </FloatingMenu>
    )

}

export default NotificationMenu
