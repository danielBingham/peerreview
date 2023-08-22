import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { postJournalSubmissionReviewers, deleteJournalSubmissionReviewer, postJournalSubmissionEditors, deleteJournalSubmissionEditor, cleanupRequest } from '/state/journalSubmissions'

import { CheckIcon } from '@heroicons/react/24/outline'

import { FloatingMenu, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuHeader, FloatingMenuItem } 
    from '/components/generic/floating-menu/FloatingMenu'

import UserTag from '/components/users/UserTag'

import './AssignmentWidget.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
const AssignmentWidget = function(props) {

    // ======= Render State =========================================
    const [ assigneeSearchString, setAssigneeSearchString ] = useState('')

    // ======= Request Tracking =====================================

    // postJournalSubmissionReviewers OR postJournalSubmissionEditors
    const [ assignmentRequestId, setAssignmentRequestId] = useState(null)
    const assignmentRequest = useSelector(function(state) {
        return state.journalSubmissions.requests[assignmentRequestId]
    })

    // deleteJournalSubmissionReviewers OR deleteJournalSubmissionEditors
    const [ unassignmentRequestId, setUnassignmentRequestId] = useState(null)
    const unassignmentRequest = useSelector(function(state) {
        return state.journalSubmissions.requests[unassignmentRequestId]
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
        if ( state.journals.dictionary[submission.journalId] ) {
            return state.journals.dictionary[submission.journalId]
        } else {
            return null
        }
    })

    const userDictionary = useSelector(function(state) {
        return state.users.dictionary
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const assignUser = function(userId) {
        const assignee = {
            userId: userId,
            assignment: props.type
        }
        
        if ( props.type == 'reviewer' ) {
            setAssignmentRequestId(dispatch(postJournalSubmissionReviewers(submission.journalId, props.id, assignee))) 
        } else {
            setAssignmentRequestId(dispatch(postJournalSubmissionEditors(submission.journalId, props.id, assignee)))
        }
    }

    const unassignUser = function(userId) {
        if ( props.type == 'reviewer' ) {
            setUnassignmentRequestId(dispatch(deleteJournalSubmissionReviewer(submission.journalId, props.id, userId)))
        } else {
            setUnassignmentRequestId(dispatch(deleteJournalSubmissionEditor(submission.journalId, props.id, userId)))
        }
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        return function cleanup() {
            if ( assignmentRequestId ) {
                cleanupRequest({ requestId: assignmentRequestId })
            }
        }
    }, [ assignmentRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( unassignmentRequestId ) {
                cleanupRequest({ requestId: unassignmentRequestId })
            }
        }
    }, [ unassignmentRequestId ])

    // ======= Render ===============================================
 
    const assignees = (props.type == 'editor' ? submission.editors : submission.reviewers)

    let assignedMenuViews = []
    let assignedViews = []
    for(const assignee of assignees) {
        assignedMenuViews.push(
            <FloatingMenuItem 
                key={assignee.userId}
                onClick={ 
                    (e) => { e.preventDefault(); e.stopPropagation(); unassignUser(assignee.userId) }
                } 
                className="assigned-member"
            >
                <CheckIcon className="check" /> <UserTag id={assignee.userId} link={false} />
            </FloatingMenuItem>
        )

        assignedViews.push(
            <div key={assignee.userId} className="assignee">
                 <UserTag id={assignee.userId} link={false} />
            </div>
        )
    }

    let members = journal.members 
    if ( assigneeSearchString ) {
        members = journal.members.filter(function(m) {
            return userDictionary[m.userId]?.name
                .toLowerCase().includes(assigneeSearchString.toLowerCase())
        })
    } 

    let memberViews = []
    for(const member of members ) {
        if ( props.type == 'editor' && member.permissions == 'reviewer') {
            continue
        }

        if ( assignees.find((a) => a.userId == member.userId) ) {
            continue
        }

        memberViews.push(
            <FloatingMenuItem 
                key={member.userId}
                onClick={ 
                    (e) => { e.preventDefault(); e.stopPropagation(); assignUser(member.userId) }
                } 
                className="member"
            >
                <UserTag id={member.userId} link={false} />
            </FloatingMenuItem>
        )
    }
    if ( assignedViews.length <= 0 ) {
        assignedViews = (<div>No {props.type} currently assigned.</div>)
    }

    return (
        <div className="assignment-widget">
            <FloatingMenu>
                <FloatingMenuTrigger>
                    Assign { props.type == 'editor' ? 'Editors' : 'Reviewers' } 
                </FloatingMenuTrigger>
                <FloatingMenuBody>
                    <FloatingMenuHeader>
                        <div>
                            <input 
                                type="text" 
                                value={assigneeSearchString}
                                onChange={ (e) => setAssigneeSearchString(e.target.value) }
                                placeholder={`Filter for ${props.type} to assign...`}
                            />
                        </div>
                    </FloatingMenuHeader>
                    { assignedMenuViews }                 
                    { memberViews }    
                </FloatingMenuBody>
            </FloatingMenu>
            <div className="assigned-members">
                { assignedViews}                
            </div>
        </div>
    )

}

export default AssignmentWidget 
