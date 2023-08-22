import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { getJournal, cleanupRequest } from '/state/journals'

import Spinner from '/components/Spinner'

const JournalView = function({ id }) {

    // ================= Request Tracking =====================================

    const [ journalRequestId, setJournalRequestId ] = useState(null)
    const journalRequest = useSelector(function(state) {
        if ( ! journalRequestId) {
            return null
        } else {
           return state.journals.requests[journalRequestId]
        }
    })

    // ================= Redux State ==========================================

    const journal = useSelector(function(state) {
        if ( ! state.journals.dictionary[id] ) {
            return null
        } else {
            return state.journals.dictionary[id]
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ================= Effect Handling  ================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        setJournalRequestId(dispatch(getJournal(id, { relations: [ 'submissions' ] })))
    }, [id])

    useEffect(function() {
        return function cleanup() {
            if ( journalRequestId ) {
                dispatch(cleanupRequest({ requestId: journalRequestId }))
            }
        }
    }, [ journalRequestId ])

    // ================= Render ===============================================

    if ( ! journal ) {
        return (
            <Spinner />
        )
    } 

    return (
        <div className="journal-view">
            <h1>{ journal.name }</h1>
            <div className="description">
                { journal.description }
            </div>
        </div>
    )

}

export default JournalView
