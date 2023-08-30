import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams, Link } from 'react-router-dom'

import { CheckIcon, XCircleIcon } from '@heroicons/react/24/solid'

import { getJournals, cleanupRequest } from '/state/journals'

import { FloatingMenu, FloatingMenuHeader, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import Spinner from '/components/Spinner'

import JournalSuggestions from '/components/journals/JournalSuggestions'
import JournalTag from '/components/journals/JournalTag'

import './JournalFilterMenu.css'

const JournalFilterMenu = function({}) {

    // ============ Query State ===============================================
    
    const [ searchParams, setSearchParams ] = useSearchParams()
    let journalIds = searchParams.getAll('journals')

    // ============ Render State ==============================================

    const [ journalsInternal, setJournalsInternal ] = useState([])
    
    // ============ Request Tracking =========================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.journals.requests[requestId]
        } else {
            return null
        }
    })

    // ============ Redux State ===============================================

    const journals = useSelector(function(state) {
        const results = []
        for(const id of journalIds) {
            if ( state.journals.dictionary[id] ) {
                results.push(state.journals.dictionary[id])
            }
        }
        return results
    })

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

    // ============ Helpers and Action Handling ======================================
    
    const setJournal = function(journal) {
        const journals = [ ...journalsInternal, journal ]
        setJournalsInternal(journals)

        searchParams.delete('journals')
        for(const journal of journals) {
            searchParams.append('journals', journal.id)
        }
        setSearchParams(searchParams)
    }

    const removeJournal = function(id) {
        const journals = [ ...journalsInternal.filter((u) => u.id != id) ]
        setJournalsInternal(journals)

        searchParams.delete('journals')
        for(const journal of journals) {
            searchParams.append('journals', journal.id)
        }
        setSearchParams(searchParams)
    }

    // ============ Effect Handling ===========================================
    
    const dispatch = useDispatch() 

    useEffect(function() {
        const journalIds = searchParams.getAll('journals')

        // We need to query for one or more of our journals.
        if ( journalIds.length !== journals.length ) {
            setRequestId(dispatch(getJournals('JournalFilterMenu', { ids: journalIds }))) 
        } 
    }, [ searchParams ])

    useEffect(function() {
        if ( journalIds.length == journals.length ) {
            setJournalsInternal(journals)
        }
    }, [ request])


    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ============ Render ====================================================

    let selectedContent = ( <Spinner local={true} /> )
    if ( journalIds.length == journalsInternal.length ) {
        const journalViews = []
        for ( const id of journalIds ) {
            journalViews.push(
                <FloatingMenuItem key={id} onClick={(e) => { e.preventDefault(); removeJournal(id); }}  className="selected-journal">
                    <CheckIcon className="check" /> { journalsInternal.find((j) => j.id == id).name } 
                </FloatingMenuItem>
            )
        }

        selectedContent = (
            <>
                <div className="selected-journals">
                    { journalViews }
                </div>
            </>
        )
    }


    let selectedView = ''
    if ( journalsInternal.length ) {
        if ( journalsInternal.length == 1 ) {
            selectedView = `:${journalsInternal[0].name}`
        } else if ( journalsInternal.length == 2 ) {
            selectedView = `:${journalsInternal[0].name},${journalsInternal[1].name}`
        } else {
            selectedView = `:multiple`
        }
    }

    let suggestedItems = []
    for(const journal of journalSuggestions ) {
        if ( ! journalIds.find((id) => id == journal.id) ) {
            suggestedItems.push(
                <FloatingMenuItem key={journal.id} className="suggested-journal" onClick={(e) => { e.preventDefault(); setJournal(journal); }} >
                    { journal.name } 
                </FloatingMenuItem>
            )
        }
    }

    return (
        <FloatingMenu className="journals-filter-menu">
            <FloatingMenuTrigger>Journals{selectedView}</FloatingMenuTrigger>
            <FloatingMenuBody>
                <FloatingMenuHeader>
                    <JournalSuggestions />
                </FloatingMenuHeader>
                { selectedContent }
                { suggestedItems }            
            </FloatingMenuBody>
        </FloatingMenu> 
    )

}

export default JournalFilterMenu 
