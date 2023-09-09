import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { getJournals, clearJournalQuery, cleanupRequest } from '/state/journals'

import Spinner from '/components/Spinner'

import JournalTag from '/components/journals/JournalTag'

import './JournalSelectionInput.css'

const JournalSelectionInput = function(props) {

    const [ searchParams, setSearchParams ] = useSearchParams()
    const initialJournalId = searchParams.get('journal')

    // ======= Render State =========================================

    const [journalName, setJournalName] = useState('')
    const [ selectedJournalId, setSelectedJournalId] = useState(null)

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
    const selectJournal = function(journal) {
        setJournalName('')
        clearSuggestions()

        setSelectedJournalId(journal.id)
        props.setSelectedJournalId(journal.id)
    }

    const removeJournal = function() {
        setJournalName('')
        clearSuggestions()

        setSelectedJournalId(null)
        props.setSelectedJournalId(null)

        searchParams.delete('journal')
        setSearchParams(searchParams)
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
                selectJournal(journalSuggestions[highlightedSuggestion])
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

    useEffect(function() {
        const journalId = searchParams.get('journal')
        if ( journalId ) {
            setSelectedJournalId(journalId)
            props.setSelectedJournalId(journalId)
        }
    }, [ searchParams ])

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
        for ( const [ index, suggestedJournal] of journalSuggestions.entries()) {
            suggestedJournalList.push(
                <div key={suggestedJournal.id} 
                    onMouseDown={(event) => { selectJournal(suggestedJournal) }} 
                    className={ index == highlightedSuggestion ? "journal-suggestion highlighted" : "journal-suggestion" }
                >
                    {suggestedJournal.name}
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
            { props.label &&  <h3>{ props.label }</h3> }
            { props.explanation && <div className="explanation">{ props.explanation }</div> }
            { selectedJournalId && 
                <div className="selected-journal">
                    <strong>Submitting to:</strong> <JournalTag id={selectedJournalId} onRemove={(e) => { removeJournal() }} />
                </div>
            }
            { ! selectedJournalId && <div className="input-wrapper">
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
            </div> }
        </div>
    )

}

export default JournalSelectionInput 
