import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import { XCircleIcon } from '@heroicons/react/24/solid'

import { getJournal, cleanupRequest } from '/state/journals'

import './JournalTag.css'

const JournalTag = function({ submission, id, onRemove }) {

    // ======= Request Tracking =====================================

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId) {
            return state.journals.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const journal = useSelector(function(state) {
        if ( submission ) {
            return state.journals.dictionary[submission.journalId]
        } else if ( id ) {
            return state.journals.dictionary[id]
        } else {
            return null
        }
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! journal && submission ) {
            dispatch(getJournal(submission.journalId))
        } else if ( ! journal && id ) {
            dispatch(getJournal(id))
        }

    }, [])


    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================
  
    let content = null 

    if ( journal ) {
        let statusView = ''
        if ( submission ) {
            if ( submission.status == 'submitted') {
                statusView = "Submitted to "
            } else if ( submission.status == 'review') {
                statusView = "Under Review at "
            } else if ( submission.status == 'proofing') {
                statusView = "In Proofing at "
            } 
        }
         
        if ( submission && submission.status !== 'published' ) {
            content = ( 
                <div>
                    <Link to={`/journal/${submission.journalId}/submissions`}> { statusView } {journal.name}</Link>
                </div> 
            )  
        } else {
            content = (
                <div>
                    <Link to={`/journal/${journal.id}`}>{journal.name}</Link> { onRemove && <XCircleIcon onClick={onRemove} /> } 
                </div> 
            )
        }
    }

    return (
        <div className="journal-tag">
            { content }
        </div>

    )

}

export default JournalTag
