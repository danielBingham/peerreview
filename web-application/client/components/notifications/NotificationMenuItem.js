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
        console.log(`NotificationClicked: ${notification.id}`)
        console.log(notification)

        if ( notification.isRead == false ) {
            const patchedNotification = { ...notification }
            patchedNotification.isRead = true

            setRequestId(dispatch(patchNotification(patchedNotification)))
        }

        console.log(`Navigate: ${notification.path}`)
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
