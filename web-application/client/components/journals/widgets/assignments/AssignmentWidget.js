import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { postJournalSubmissionReviewers, deleteJournalSubmissionReviewer, postJournalSubmissionEditors, deleteJournalSubmissionEditor, cleanupRequest } from '/state/journalSubmissions'

import { CheckCircleIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, XCircleIcon } from '@heroicons/react/24/outline'
import  { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid'

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

    const mostRecentVisibleVersion = useSelector(function(state) {
        return state.paperVersions.mostRecentVersion[submission.PaperId]
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
        let reviewRecommendation = null
        if ( props.type == 'reviewer' ) {
            const review = assignee.reviews.find((r) => r.paperVersionId == mostRecentVisibleVersion)
            if ( review ) {
                if ( review.recommendation == 'commentary' ) {
                    reviewRecommendation = (<span className="commentary"><ChatBubbleLeftRightIcon /> </span>)
                } else if ( review.recommendation == 'approve' ) {
                    reviewRecommendation = (<span className="approved"><CheckCircleIcon /></span>)
                } else if ( review.recommendation == 'request-changes' ) {
                    reviewRecommendation = (<span className="request-changes"><ClipboardDocumentListIcon/></span>)
                } else if ( review.recommendation == 'reject' ) {
                    reviewRecommendation = (<span className="rejected"><XCircleIcon /></span> )
                }
            }
        }

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
                <UserTag id={assignee.userId} link={false} /> <span className="recommendation">{reviewRecommendation}</span>
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

    const membership = currentUser.memberships.find((m) => m.journalId == submission.journalId)

    const isEditor =  membership && ( membership.permissions == 'owner' || membership.permissions == 'editor' ) ? true : false
    const isManagingEditor = membership && membership.permissions == 'owner' ? true : false
    const isAssignedEditor = submission.editors.find((e) => e.userId == currentUser.id) ? true : false 

    if ( journal.model == 'closed' && ( ! isManagingEditor && ! isAssignedEditor )) {
        return (
        <div className="assignment-widget">
            <div>Assigned { props.type == 'editor' ? 'Editors' : 'Reviewers' }</div>
            <div className="assigned-members">
                { assignedViews}                
            </div>
        </div>
        )
    }

    return (
        <div className="assignment-widget">
            <FloatingMenu>
                <FloatingMenuTrigger>
                    Assign { props.type == 'editor' ? 'Editors' : 'Reviewers' } 
                </FloatingMenuTrigger>
                <FloatingMenuBody>
                    <FloatingMenuHeader title={`Assign ${props.type == 'editors' ? 'Editors' : 'Reviewers'}`}>
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
