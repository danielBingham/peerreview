import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { XMarkIcon } from '@heroicons/react/20/solid'

import { deleteJournalMember, cleanupRequest } from '/state/journals'

import MemberPermissionsWidget from '/components/journals/widgets/members/MemberPermissionsWidget'
import UserTag from '/components/users/UserTag'

import Spinner from '/components/Spinner'

import './JournalMembersListItem.css'

const JournalMembersListItem = function({ member }) {

    // ================ Render State ================================

    // ================== Request Tracking ====================================
    
    const [ requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
           return state.journals.requests[requestId]
        }
    })

    // ================= Redux State ================================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const currentUserPermissions = currentUser.memberships.find((m) => m.journalId == member.journalId)?.permissions
    const canModify = (
        (member.permissions == 'editor' && currentUserPermissions == 'owner')
        || (member.permissions == 'reviewer' && (currentUserPermissions == 'owner' || currentUserPermissions == 'editor'))
    )


    // =========== Actions and Event Handling =====================================

    const dispatch = useDispatch()

    const removeMember = function(event) {
        event.preventDefault()

        if ( ! canModify ) {
            return 
        }

        setRequestId(dispatch(deleteJournalMember(member.journalId, member.userId)))
    }

    const assignPermissions = function(event) {

    }

    // ================= Effect Handling =======================
 
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ====================== Render ==========================================

    return (
        <div className="journal-member-list-item">
            <div className="grid-wrapper">
                <div className="user">
                    <UserTag id={ member.userId} />
                </div>
                <div className="permissions">
                    <MemberPermissionsWidget member={member} /> 
                </div>
                <div className="remove">
                    { canModify && <a href="" onClick={removeMember} ><XMarkIcon /></a> }
                </div>
            </div>
        </div>
    )

}

export default JournalMembersListItem 
