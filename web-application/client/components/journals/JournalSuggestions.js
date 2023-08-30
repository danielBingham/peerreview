import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { XCircleIcon } from '@heroicons/react/24/solid'

import { getJournals, clearJournalQuery, cleanupRequest } from '/state/journals'

import Spinner from '/components/Spinner'

import JournalTag from '/components/journals/JournalTag'

import './JournalSuggestions.css'

const JournalSuggestions = function(props) {

    // ======= Render State =========================================
    
    const [journalName, setJournalName] = useState('')

    const [error, setError] = useState(null)

    // ======= Request Tracking =====================================
    
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.journals.requests[requestId]
        }
    })

    // ======= Refs =================================================

    const timeoutId = useRef(null)
    const inputRef = useRef(null)

    // ======= Redux State ==========================================

    const journalSuggestions = useSelector(function(state) {
        if ( ! state.journals.queries['JournalSuggestions'] ) {
            return []
        }
        
        const journals = []
        for( const id of state.journals.queries['JournalSuggestions'].list) {
            journals.push(state.journals.dictionary[id])
        }
        return journals 
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    /**
     * Clear the suggestions list.
     */
    const clearSuggestions = function() {
        dispatch(clearJournalQuery({ name: 'JournalSuggestions'}))
        setRequestId(null)
    }

    /**
     * Query the backend for a list of suggested journals matching the given name.
     *
     * @param {string} name The name or partial name of the journal we want to
     * query for.
     */
    const suggestJournals = function(name) {
        // We don't want to make a new request until they've stopped typing,
        // but we don't want to show old data before the request runs.
        if ( name.length <= 0 ) {
            clearSuggestions()
        }

        if ( timeoutId.current ) {
            clearTimeout(timeoutId.current)
        }
        timeoutId.current = setTimeout(function() {
            if ( name.length > 0) {
                if ( ! requestId ) {
                    setRequestId(dispatch(getJournals('JournalSuggestions', {name: name})))
                } else if( request && request.state == 'fulfilled') {
                    setRequestId(dispatch(getJournals('JournalSuggestions', { name: name})))
                }

            } 
        }, 250)
    }

    /**
     * Handle a change in input[name="journalName"].  Meant to be used in the
     * onChange event handler.
     *
     * @param {Event} event Standard Javascript event object.
     */
    const handleChange = function(event) {
        setJournalName(event.target.value)
        suggestJournals(event.target.value)
        setError(null)
    }


    const onJournalNameBlur = function(event) {
        if ( props.onBlur ) {
            props.onBlur(event) 
        }
    }

    const onJournalNameFocus = function(event) {
        if ( props.suggestOnFocus && journalName.length > 0 ) {
            suggestJournals(event.target.value)
        }
    }

    // ======= Effect Handling ======================================

    // Clear the user list on mount and unmount.
    useEffect(function() {
        dispatch(clearJournalQuery({ name: 'JournalSuggestions' }))

        return function cleanup() {
            dispatch(clearJournalQuery({ name: 'JournalSuggestions' }))
        }
    }, [])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    return (
        <div className="journal-suggestions"> 
            <XCircleIcon className="clear" onClick={(e) => { setUserName(''); clearSuggestions()}}  /> 
            <input type="text" 
                name="journalName" 
                value={journalName}
                ref={inputRef}
                onBlur={onJournalNameBlur}
                onFocus={onJournalNameFocus}
                onChange={handleChange} 
                autoComplete="off"
                placeholder="Start typing to view journal suggestions..."
            />
        </div>
    )

}

export default JournalSuggestions 
