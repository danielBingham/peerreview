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
    if ( ! user || ! event ) {
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

const generateMinimalVisibility = function(user, event, paper, submission) {
    if ( ! event ) {
        return null
    }

    // If they are a corresponding author for the paper.
    const paperEvents = [ 
        'paper:new-version', 
        'paper:preprint-posted'
    ]
    if ( paperEvents.includes(event.type) && paper ) {
        return 'corresponding-authors' 
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
        return 'managing-editors'
    }

    return 'corresponding-authors'
}

const VisibilityControl = function({ eventId, eventType, compact }) {

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
        if ( eventId ) {
            return state.paperEvents.dictionary[eventId]
        }
        return null
    })

    const paper = useSelector(function(state) {
        if ( event ) {
            return state.papers.dictionary[event.paperId]
        }
        return null
    })

    const submission = useSelector(function(state) {
        if ( event ) {
            return state.journalSubmissions.dictionary[event.submissionId]
        }
        return null
    })

    // ============ Generated State ===========================================

    const canEdit = canEditEvent(currentUser, event, paper, submission)


    // ============ Helpers and Action Handling ===============================

    const dispatch = useDispatch()
    
    const changeVisibility = function(visibility) {
        let newVisibility = [ ...event.visibility ]
        
        let toggleOn = false
        if ( newVisibility.includes(visibility) ) {
            newVisibility = newVisibility.filter((v) => v != visibility)
        } else {
            toggleOn = true
            newVisibility.push(visibility)
        }

        const minimalVisibility = generateMinimalVisibility(currentUser, event, paper, submission)
        if ( ! newVisibility.includes(minimalVisibility) ) {
            if ( minimalVisibility == 'corresponding-authors' && ! newVisibility.includes('authors') ) {
                newVisibility.push(minimalVisibility)
            } else if ( minimalVisibility == 'managing-editors' && ! newVisibility.includes('editors') ) {
                newVisibility.push(minimalVisibility)
            }
        }

        if ( toggleOn && visibility == 'public' ) {
            newVisibility = [ 'public' ]
        } else if ( toggleOn && visibility != 'public' ) {
            newVisibility = newVisibility.filter((v) => v != 'public')

            // "authors" includes "corresponding-authors".  If you add one, remove
            // the other.
            if ( toggleOn && visibility == 'authors' ) {
                newVisibility = newVisibility.filter((v) => v != 'corresponding-authors')
            }

            if ( toggleOn && visibility == 'corresponding-authors' ) {
                newVisibility = newVisibility.filter((v) => v != 'authors')
            }

            if ( toggleOn && (visibility == 'managing-editors' || visibility == 'assigned-editors' ) ) {
                newVisibility = newVisibility.filter((v) => v != 'editors')
            }
            if ( toggleOn && visibility == 'editors' ) {
                newVisibility = newVisibility.filter((v) => v != 'managing-editors' && v != 'assigned-editors')
            }

            if ( toggleOn && visibility == 'assigned-reviewers' ) {
                newVisibility = newVisibility.filter((v) => v != 'reviewers')
            }
            if( toggleOn && visibility == 'reviewers' ) {
                newVisibility = newVisibility.filter((v) => v != 'assigned-reviewers')
            }
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

    if ( ! event ) {
        return (
            <div className="event-visibility-control">
                <EyeIcon/> None
            </div>
        )
    }

    if ( ! canEdit && ! compact ) {
        return (
             <div className="event-visibility-control">
                <EyeIcon/> { event.visibility.join(', ') }
            </div> 
        )
    } else if ( ! canEdit && compact ) {
        return null
    } else {
        const visibilities = {
            'public': false,
            'authors': [ 'corresponding-authors' ]
        }

        if ( submission ) {
            visibilities['editors'] = [ 'managing-editors', 'assigned-editors' ]
            visibilities['reviewers'] = [ 'assigned-reviewers' ]
        }
           
        const generateVisibilityMenuItem = function(visibility, selected) {
            return (
                <FloatingMenuItem className="visibility" key={visibility} onClick={(e) => changeVisibility(visibility)}>
                    { selected && <CheckIcon/>} { ! selected && <span className="check-placeholder"></span> } { visibility }
                </FloatingMenuItem>
            )
        }

        const menuItemViews = []
        for(const [ visibility, children ] of Object.entries(visibilities)) {
            if ( children ) {
                const childGroup = []
                for(const child of children) {
                    childGroup.push(generateVisibilityMenuItem(child, event.visibility.includes(child)))
                }
                menuItemViews.push(
                    <div key={visibility} className="visibility-group">
                        { generateVisibilityMenuItem(visibility, event.visibility.includes(visibility)) }
                        <div className="visibility-group-children">
                            { childGroup }
                        </div>
                    </div>
                )
            } else {
                menuItemViews.push(generateVisibilityMenuItem(visibility, event.visibility.includes(visibility)))
            }
        }

        return (
            <FloatingMenu className={`event-visibility-control ${ compact ? 'compact' : ''}`}>
                <FloatingMenuTrigger showArrow={ ! compact}><EyeIcon/> { compact ? '' : event.visibility.join(', ') }</FloatingMenuTrigger>
                <FloatingMenuBody>
                    { menuItemViews }
                </FloatingMenuBody>
            </FloatingMenu>
        )
    }

}

export default VisibilityControl
