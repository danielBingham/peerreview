import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { patchJournalSubmission, cleanupRequest } from '/state/journalSubmissions'

import { CheckIcon } from '@heroicons/react/24/outline'

import { FloatingMenu, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuHeader, FloatingMenuItem } 
    from '/components/generic/floating-menu/FloatingMenu'

import './SubmissionStatusWidget.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
const SubmissionStatusWidget = function(props) {

    // ======= Render State =========================================

    // ======= Request Tracking =====================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        return state.journalSubmissions.requests[requestId]
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const submission = useSelector(function(state) {
        if ( state.journalSubmissions.dictionary[props.id] ) {
            return state.journalSubmissions.dictionary[props.id]
        } else {
            return null
        }
    })

    const journal = useSelector(function(state) {
        if ( submission ) {
            return state.journals.dictionary[submission.journalId]
        } else {
            return null
        }
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const updateStatus = function(newStatus) {
        const submissionPatch = {
            id: submission.id,
            status: newStatus
        }

       setRequestId(dispatch(patchJournalSubmission(submission.journalId, submissionPatch))) 
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                cleanupRequest({ requestId: requestId })
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================
    //
  
    const membership = currentUser.memberships.find((m) => m.journalId == submission.journalId)

    const isEditor =  membership && ( membership.permissions == 'owner' || membership.permissions == 'editor' ) ? true : false
    const isManagingEditor = membership && membership.permissions == 'owner' ? true : false
    const isAssignedEditor = submission.editors.find((e) => e.userId == currentUser.id) ? true : false 

    if ( journal.model == 'closed' && ( ! isManagingEditor && ! isAssignedEditor )) {
        return (
            <div className="submission-status-widget">
                <strong>Status</strong>: { submission.status } 
            </div>
        )
    }
    
    const statusMenuItemViews = []
    const statuses = [ 'submitted', 'review', 'proofing' ]
    for(const status of statuses ) {
        statusMenuItemViews.push(
            <FloatingMenuItem
                key={status}
                className="status-option"
                onClick={(e) => updateStatus(status)}
            >
                { submission.status == status && <CheckIcon />} { status }
            </FloatingMenuItem>
        )
    }
   
    return (
        <FloatingMenu className="submission-status-widget">
            <FloatingMenuTrigger>
                <strong>Status</strong>: { submission.status } 
            </FloatingMenuTrigger>
            <FloatingMenuBody>
                <FloatingMenuHeader>
                    <strong>Select&nbsp;a&nbsp;new&nbsp;Status</strong>
                </FloatingMenuHeader>
                { statusMenuItemViews }
            </FloatingMenuBody>
        </FloatingMenu>
    )

}

export default SubmissionStatusWidget 
