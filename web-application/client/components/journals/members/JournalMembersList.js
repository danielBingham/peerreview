import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getJournal, cleanupRequest } from '/state/journals'

import Spinner from '/components/Spinner'
import { 
    List, 
    ListHeader, 
    ListTitle, 
    ListControls, 
    ListControl, 
    ListRowContent, 
    ListNoContent 
} from '/components/generic/list/List'
import PaginationControls from '/components/PaginationControls'

import JournalMembersListItem from '/components/journals/members/JournalMembersListItem'

import './JournalMembersList.css'

const JournalMembersList = function({ id }) {

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

    const journal = useSelector(function(state) {
        return state.journals.dictionary[id]
    })

    // =========== Actions and Event Handling =====================================

    const dispatch = useDispatch()


    // ================= Effect Handling =======================
   
    /**
     * If we haven't retrieved the journal we're viewing yet, go ahead and
     * retrieve it from the journal endpoint to get full and up to date data.
     */
    useEffect(function() {
        setRequestId(dispatch(getJournal(id)))
    }, [])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ====================== Render ==========================================

    let content = (<Spinner local="true" />)
    let noContent = null

    if ( request && request.state == 'fulfilled') {
        content = []
        for(const member of journal.members) {
            content.push(<JournalMembersListItem key={member.userId} member={member} />)
        }
    }

    return (
        <div className="journal-member-list">
            <div className="member-list-controls">
                <div className="find-members">
                    <label>Find Members</label><input type="text" />
                </div>
                <div className="invite-member">
                        <button>Invite Member</button>
                </div>
            </div>
            <List>
                <ListHeader>
                    <ListTitle>Journal Members</ListTitle>
                </ListHeader>
                <ListNoContent>
                    {noContent}
                </ListNoContent>
                <ListRowContent>
                    {content}
                </ListRowContent>
            </List>
        </div>
    )

}

export default JournalMembersList 
