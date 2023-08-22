import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { getJournals, clearJournalQuery, cleanupRequest } from '/state/journals'

import Spinner from '/components/Spinner'

import './JournalSelectionInput.css'

const JournalSelectionInput = function(props) {

    // ======= Render State =========================================

    const [journalName, setJournalName] = useState('')

    const [highlightedSuggestion, setHighlightedSuggestion] = useState(0)
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
        if ( ! state.journals.queries['JournalSelectionInput'] ) {
            return []
        }
        
        const journals = []
        for( const id of state.journals.queries['JournalSelectionInput'].list) {
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
        dispatch(clearJournalQuery({ name: 'JournalSelectionInput'}))
        setHighlightedSuggestion(0)
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
                    dispatch(clearJournalQuery({ name: 'JournalSelectionInput' }))
                    setRequestId(dispatch(getJournals('JournalSelectionInput', {name: name})))
                } else if( request && request.state == 'fulfilled') {
                    clearSuggestions()
                    setRequestId(dispatch(getJournals('JournalSelectionInput', { name: name})))
                }

                if ( highlightedSuggestion >= journalSuggestions.length+1 ) {
                    setHighlightedSuggestion(0)
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

    /**
     * Set the selected journal.
     *
     * @param {object} journal A `journal` object to set in the parent.
     */
    const setJournal = function(journal) {
        setJournalName('')
        clearSuggestions()

        props.setJournal(journal)
    }

    /**
     * Handle the keyDown event on input[name="journalName"].  For "enter" we
     * want to set the highlighted Journal in the parent.  For the arrow
     * keys, we want to move the highlight up and down the list of
     * suggestions.
     *
     * @param {KeyboardEvent} event A standard Javascript KeyboardEvent object.
     */
    const handleKeyDown = function(event) {
        if ( event.key == "Enter" ) {
            event.preventDefault()
            const suggestionsWrappers = document.getElementsByClassName('journal-suggestions')
            const suggestions = suggestionsWrappers[0].children
            if (suggestions.length > 0) {
                setJournal(journalSuggestions[highlightedSuggestion])
            }
        } else if ( event.key == "ArrowDown" ) {
            event.preventDefault()
            let newHighlightedSuggestion = highlightedSuggestion+1
            if ( newHighlightedSuggestion >= journalSuggestions.length+1) {
                newHighlightedSuggestion = journalSuggestions.length
            }
            setHighlightedSuggestion(newHighlightedSuggestion)
        } else if ( event.key == "ArrowUp" ) {
            event.preventDefault()
            let newHighlightedSuggestion = highlightedSuggestion-1
            if ( newHighlightedSuggestion < 0) {
                newHighlightedSuggestion = 0 
            }
            setHighlightedSuggestion(newHighlightedSuggestion)
        } 
    }


    const onJournalNameBlur = function(event) {
        clearSuggestions()

        if ( props.onBlur ) {
            props.onBlur(event) 
        }
    }

    const onJournalNameFocus = function(event) {
        if ( journalName.length > 0 ) {
            suggestJournals(event.target.value)
        }
    }

    // ======= Effect Handling ======================================

    // Clear the user list on mount.  
    useLayoutEffect(function() {
        dispatch(clearJournalQuery({ name: 'JournalSelectionInput' }))
    }, [])

    // Make sure the highlightedSuggestion is never outside the bounds of the
    // journalSuggestions list (plus the journal invite selection).
    useLayoutEffect(function() {
        if ( highlightedSuggestion >= journalSuggestions.length+1 && highlightedSuggestion != 0) {
            setHighlightedSuggestion(0)
        }
    }, [ highlightedSuggestion, journalSuggestions ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    let suggestedJournalList = []
    let suggestionsError = null
    if ( request && request.state != 'failed') {
        for ( const [ index, journal] of journalSuggestions.entries()) {
            suggestedJournalList.push(
                <div key={journal.id} 
                    onMouseDown={(event) => { setJournal(journal) }} 
                    className={ index == highlightedSuggestion ? "journal-suggestion highlighted" : "journal-suggestion" }
                >
                    {journal.name}
                </div>
            )
        }

    } else if ( request && request.state == 'failed' ) {
        suggestionsError = (
            <div className="error">
                The attempt to retrieve journal suggestions from the backend
                failed with error: { request.error }. Please report this as a
                bug.
            </div>
        )
    } 

    let errorView = null
    if ( error == 'journal-already-added' ) {
        errorView = ( <div className="error">That journal has already been added to this paper!</div> )
    }

    return (
        <div className="journals-input field-wrapper"> 
            <h3>Select a Journal</h3>
            <div className="explanation">Select a journal you wish to submit this paper to.  You may leave this blank and choose to submit your paper at a later date after collecting co-author feedback and/or preprint feedback.</div>
            <input type="text" 
                name="journalName" 
                value={journalName}
                ref={inputRef}
                onKeyDown={handleKeyDown}
                onBlur={onJournalNameBlur}
                onFocus={onJournalNameFocus}
                onChange={handleChange} 
            />
            { errorView }
            <div className="journal-suggestions" 
                style={ ( suggestedJournalList.length > 0 || suggestionsError ? { display: 'block' } : { display: 'none' } ) }
            >
                { suggestionsError }
                { suggestedJournalList }
            </div>
        </div>
    )

}

export default JournalSelectionInput 
