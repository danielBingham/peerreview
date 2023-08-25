import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { XMarkIcon } from '@heroicons/react/20/solid'

import { patchJournalMember, cleanupRequest } from '/state/journals'

import UserTag from '/components/users/UserTag'

import ErrorNotice from '/components/generic/error-notice/ErrorNotice'
import Spinner from '/components/Spinner'

import './MemberPermissionsWidget.css'

const MemberPermissionsWidget = function({ member }) {

    // ================ Render State ================================

    const [ error, setError ] = useState(null)

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

    const journal = useSelector(function(state) {
        return state.journals.dictionary[member.journalId]
    })

    const currentUserPermissions = currentUser.memberships.find((m) => m.journalId == member.journalId)?.permissions
    const canModify = ( currentUserPermissions == 'owner' )

    // =========== Actions and Event Handling =====================================

    const dispatch = useDispatch()

    const assignPermissions = function(permissions) {
        if ( member.permissions == 'owner' && permissions !== 'owner') {
            const remainingOwner = journal.members.find((m) => m.userId != member.userId && m.permissions == 'owner')
            if ( ! remainingOwner ) {
                setError('no-owner')
                return
            }
        } else {
            setError(null)
        }

        const newMember = { ...member }
        newMember.permissions = permissions

        setRequestId(dispatch(patchJournalMember(member.journalId, newMember)))
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

    let content = null 
    if ( canModify ) {
        let errorView = null
        if ( error == 'no-owner') {
            errorView = ( 
                <ErrorNotice onClose={() => setError(null)} >
                    You cannot remove the last remaining Managing Editor.  Promote someone to Managing Editor before demoting.
                </ErrorNotice>
            )
        }
        content = (
            <div className="role-selection">
                <select 
                    onChange={(e) => assignPermissions(e.target.value) } 
                    value={ member.permissions } name="permissions"
                > 
                    <option value="owner">Managing Editor</option>
                    <option value="editor">Editor</option>
                    <option value="reviewer">Reviewer</option>
                </select>
                { errorView } 
            </div>
        )
    } else {
        content = "Reviewer"
        if ( member.permissions == "owner") {
            content = "Managing Editor"
        } else if ( member.permissions == 'editor' ) {
            content = "Editor"
        } else if ( member.permissions == "reviewer") {
            content = "Reviewer"
        }
    }

    return (
        <div className="role">
            { content }
        </div>
    )

}

export default MemberPermissionsWidget

