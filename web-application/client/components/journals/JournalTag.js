import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import { getJournal, cleanupRequest } from '/state/journals'

import './JournalTag.css'

const JournalTag = function(props) {

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
        return state.journals.dictionary[props.submission.journalId]
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! journal ) {
            dispatch(getJournal(props.submission.journalId))
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
        if ( props.submission.status == 'submitted') {
            statusView = "Submitted to "
        } else if ( props.submission.status == 'review') {
            statusView = "Under Review at "
        } else if ( props.submission.status == 'proofing') {
            statusView = "In Proofing at "
        } 
     
        if ( props.paper.isDraft ) {
            content = ( 
                <div>
                    <Link to={`/journal/${props.submission.journalId}/submissions`}> { statusView } {journal.name}</Link>
                </div> 
            )  
        } else {
            content = (
                <div>
                    <Link to={`/journal/${props.submission.journalId}`}>{journal.name}</Link>
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
