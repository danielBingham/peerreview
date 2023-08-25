import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { XMarkIcon } from '@heroicons/react/24/solid'

import { postJournalMembers, cleanupRequest } from '/state/journals'

import Modal from '/components/generic/modal/Modal'
import Button from '/components/generic/button/Button'

import UserInput from '/components/users/input/UserInput'
import UserTag from '/components/users/UserTag'

import './InviteJournalMemberModal.css'

const InviteJournalMemberModal = function({ id }) {

    // ================ Render State ================================
    const [ showInviteModal, setShowInviteModal ] = useState(false)
    const [ selectedUser, setSelectedUser ] = useState(null)

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
        return state.journals.dictionary[id]
    })

    // ============ State Existence Checks ====================================

    if ( ! journal ) {
        throw new Error(`Must have already retrieved Journal(${id}) in order to use InviteJournalMemberModal.`)
    }

    // =========== Actions and Event Handling =====================================

    const dispatch = useDispatch()

    const selectUser = function(user) {
        setSelectedUser(user)
    }

    const inviteSelectedUser = function() {
        const member = {
            userId: selectedUser.id,
            order: journal.members.length,
            permissions: 'reviewer'
        }

        setRequestId(dispatch(postJournalMembers(journal.id, member)))

        setSelectedUser(null)
        setShowInviteModal(false)
    }

    // ================= Effect Handling =======================

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ====================== Render ==========================================

    let content = null
    if ( ! selectedUser ) {
        content = (<UserInput selectUser={selectUser} />)
    } else {
        content = (
            <div className="selected-user">
                <UserTag id={selectedUser.id} /> 
                <XMarkIcon className="cancel" onClick={(e) => setSelectedUser(null)} />
            </div> 
        ) 
    }

    return (
        <div className="invite-journal-member-modal">
            <div className="invite-member-trigger">
                <Button onClick={(e) => setShowInviteModal(true)}>Invite Member</Button>
            </div>
            <Modal isVisible={showInviteModal} setIsVisible={setShowInviteModal} className='invite-member-modal'>
                <h2>Invite Member to { journal.name }</h2>
                <div className="explanation">
                Invite a new member to your Journal.  They will be added as a
                    "reviewer" and you can change their role once they are added.
                </div>
                { content }
                <Button onClick={inviteSelectedUser}>Invite Member</Button>
            </Modal> 
        </div>
    )

}

export default InviteJournalMemberModal 
