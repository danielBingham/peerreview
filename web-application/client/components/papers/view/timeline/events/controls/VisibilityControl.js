import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { EyeIcon, CheckIcon } from '@heroicons/react/24/outline'

import { patchPaperEvent, cleanupRequest } from '/state/paperEvents'

import { FloatingMenu, FloatingMenuHeader, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import './VisibilityControl.css'

/**
 *
 * @see PaperEventService::canEditEvent()
 */
const canEditEvent = function(user, event, paper, submission) {
    if ( ! user ) {
        return false
    }

    if ( event.actorId == user.id ) {
        return true
    }

    // If they are a corresponding author for the paper.
    const paperEvents = [ 
        'paper:new-version', 
        'paper:preprint-posted'
    ]
    if ( paperEvents.includes(event.type) && paper ) {
        const author = paper.authors.find((a) => a.userId == user.id)
        if ( author && author.owner ) {
            return true
        } 
    }

    // If they are a managing editor or assigned editor for this
    // submission.
    const submissionEvents = [
        'submission:new', 
        'submission:new-review',
        'submission:status-changed',
        'submission:reviewer-assigned',
        'submission:reviewer-unassigned',
        'submission:editor-assigned',
        'submission:editor-unassigned'
    ]
    if ( submissionEvents.includes(event.type) && submission ) {
        const membership = user.memberships.find((m) => m.journalId == submission.journalId)
        if ( membership ) {
            // Managing editor
            if ( membership.permissions == 'owner' ) {
                return true
                // assigned editor
            } else if ( membership.permissions == 'editor' ) {
                const userAssigned = submission.editors.find((e) => e.userId == user.id)
                if ( userAssigned ) {
                    return true
                }
            }
        }
    }

    return false
}

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

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[event.paperId]
    })

    const submission = useSelector(function(state) {
        return state.journalSubmissions.dictionary[event.submissionId]
    })

    // ============ Generated State ===========================================

    const canEdit = canEditEvent(currentUser, event, paper, submission)


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

    if ( ! canEdit ) {
        return (
            <div className="event-visibility-control">
                <EyeIcon/> { event.visibility.join() }
            </div>
        )
    } else {
        const visibilities = [
            'corresponding-authors',
            'authors',
            'public'
        ]

        if ( submission ) {
            visibilities.push('managing-editors', 'editors', 'assigned-editors', 'reviewers', 'assigned-reviewers')
        }
            


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
                <FloatingMenuTrigger><EyeIcon/> { event.visibility.join(', ') }</FloatingMenuTrigger>
                <FloatingMenuBody>
                    { menuItemViews }
                </FloatingMenuBody>
            </FloatingMenu>
        )
    }

}

export default VisibilityControl
