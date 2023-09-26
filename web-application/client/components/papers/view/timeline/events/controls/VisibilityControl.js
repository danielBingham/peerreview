import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { EyeIcon, CheckIcon } from '@heroicons/react/24/outline'

import { patchPaperEvent, cleanupRequest } from '/state/paperEvents'

import { FloatingMenu, FloatingMenuHeader, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import './VisibilityControl.css'

const VisibilityControl = function({ eventId }) {

    // ============ Request Tracking ==========================================

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.paperEvents.requests[requestId]
        } else {
            return null
        }
    })

    // ============ Redux State ===============================================

    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    // ============ Helpers and Action Handling ===============================

    const dispatch = useDispatch()
    
    const changeVisibility = function(visibility) {
        let newVisibility = [ ...event.visibility ]
        if ( newVisibility.includes(visibility) ) {
            newVisibility = newVisibility.filter((v) => v != visibility)
        } else {
            newVisibility.push(visibility)
        }

        const newEvent = { 
            id: event.id,
            visibility: newVisibility
        }

        setRequestId(dispatch(patchPaperEvent(event.paperId, newEvent)))
    }

    // ============ Effect Handling ===========================================

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ============ Render ====================================================
    const visibilities = [
        'managing-editor',
        'editors',
        'assigned-editors',
        'reviewers',
        'assigned-reviewers',
        'corresponding-author',
        'authors',
        'public'
    ]

    const menuItemViews = []
    for(const visibility of visibilities) {
        if ( event.visibility.includes(visibility) ) {
            menuItemViews.push(
                <FloatingMenuItem className="visibility" key={visibility} onClick={(e) => changeVisibility(visibility)}>
                    <CheckIcon/> { visibility }
                </FloatingMenuItem>
            )
        } else {
            menuItemViews.push(
                <FloatingMenuItem className="visibility" key={visibility} onClick={(e) => changeVisibility(visibility)}>
                     { visibility }
                </FloatingMenuItem>
            )
        }
    }


    return (
        <FloatingMenu className="event-visibility-control">
            <FloatingMenuTrigger><EyeIcon/> { event.visibility.join() }</FloatingMenuTrigger>
            <FloatingMenuBody>
                { menuItemViews }
            </FloatingMenuBody>
        </FloatingMenu>
    )

}

export default VisibilityControl
