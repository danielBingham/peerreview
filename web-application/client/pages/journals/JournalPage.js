import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { getJournal, cleanupRequest } from '/state/journals'

import JournalView from '/components/journals/JournalView'

import Spinner from '/components/Spinner'

const JournalPage = function(props) {

    // ======= Routing Parameters ===================================
    
    const { id } = useParams() 
    
    // ================= Request Tracking =====================================
    
    const [ requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
           return state.journals.requests[requestId]
        }
    })

    // ================= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const journal = useSelector(function(state) {
        return state.journals.dictionary[id]
    })

    // ======= Effect Handling =====================
    
    const dispatch = useDispatch()
    
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


    // ================= Render ===============================================
   
    let content = ( <Spinner /> )
    if (  request && request.state == 'fulfilled') {
        content = ( <JournalView id={id} /> )
    } 

    return (
        <div id="journal-page" className="page">
            { content } 
        </div>
    )

}

export default JournalPage
