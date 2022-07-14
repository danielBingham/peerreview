import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { getUsers, clearList, cleanupRequest } from '/state/users'

import UserTag from '/components/users/UserTag'
import Spinner from '/components/Spinner'

import './AuthorsInput.css'

/**
 * @see `/server/daos/papers.js::hydratePapers()` for the structure of the
 * `author` object.
 *
 * @see `/server/daos/users.js::hydrateUsers()` for the structure of the `user`
 * object.
 */

/**
 * An input field allowing the user to enter a list of authors, with
 * suggestions.  Assumes a parent component is managing the list of selected
 * authors and takes both the list and a function to set it.
 *
 * @param {object} props    Standard React props object.
 * @param {object[]} props.authors  A list of authors who have already been selected.
 * @param {function} props.setAuthors   Set the list of selected authors.
 */
const AuthorsInput = function(props) {

    // ======= Render State =========================================

    const [authorName, setAuthorName] = useState('')

    const [highlightedSuggestion, setHighlightedSuggestion] = useState(0)
    const [suggestionsError, setSuggestionsError] = useState(null)

    // ======= Request Tracking =====================================
    const [requestId, setRequestId] = useState(null)

    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.users.requests[requestId]
        }
    })

    // ======= Refs =================================================

    const timeoutId = useRef(null)

    // ======= Redux State ==========================================

    const userSuggestions = useSelector(function(state) {
        return state.users.list
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    /**
     * Clear the suggestions list.
     */
    const clearSuggestions = function() {
        dispatch(clearList())
        setHighlightedSuggestion(0)
    }

    /**
     * Query the backend for a list of suggested users matching the given name.
     *
     * @param {string} name The name or partial name of the user we want to
     * query for.
     */
    const suggestAuthors = function(name) {
        if ( timeoutId.current ) {
            clearTimeout(timeoutId.current)
        }
        timeoutId.current = setTimeout(function() {
            if ( name.length > 0) {
                if ( ! requestId ) {
                    dispatch(clearList())
                    setRequestId(dispatch(getUsers({name: name})))
                } else if( request && request.state == 'fulfilled') {
                    clearSuggestions()
                    setRequestId(dispatch(getUsers({ name: name})))
                }

                if ( highlightedSuggestion >= userSuggestions.length ) {
                    setHighlightedSuggestion(0)
                }

            } else {
                clearSuggestions()
            }
        }, 250)
    }

    /**
     * Handle a change in input[name="authorName"].  Meant to be used in the
     * onChange event handler.
     *
     * @param {Event} event Standard Javascript event object.
     */
    const handleChange = function(event) {
        setAuthorName(event.target.value)
        suggestAuthors(event.target.value)
    }

    /**
     * Append a user to the selected author list.
     *
     * @param {object} user A `user` object to append to the list of selected
     * authors.
     */
    const appendAuthor = function(user) {
        setAuthorName('')
        clearSuggestions()

        const author = {
            user: user,
            order: props.authors.length+1,
            owner: false
        }
        props.setAuthors([ ...props.authors,author])
    }

    /**
     * Handle the keyDown event on input[name="authorName"].  For "enter" we
     * want to append the highlighted user to the AuthorList.  For the arrow
     * keys, we want to move the highlight up and down the list of
     * suggestions.
     *
     * @param {KeyboardEvent} event A standard Javascript KeyboardEvent object.
     */
    const handleKeyDown = function(event) {
        if ( event.key == "Enter" ) {
            event.preventDefault()
            const suggestionsWrappers = document.getElementsByClassName('author-suggestions')
            const suggestions = suggestionsWrappers[0].children
            if (suggestions.length > 0) {
                suggestions[highlightedSuggestion].click()
            }
        } else if ( event.key == "ArrowDown" ) {
            event.preventDefault()
            let newHighlightedSuggestion = highlightedSuggestion+1
            if ( newHighlightedSuggestion >= userSuggestions.length) {
                newHighlightedSuggestion = userSuggestions.length-1
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

    // ======= Effect Handling ======================================

    // Clear the user list on mount.  
    useLayoutEffect(function() {
        dispatch(clearList())
    }, [])

    // Make sure the highlightedSuggestion is never outside the bounds of the
    // userSuggestions list.
    useLayoutEffect(function() {
        if ( highlightedSuggestion >= userSuggestions.length) {
            setHighlightedSuggestion(0)
        }
    }, [ highlightedSuggestion, userSuggestions ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================
    
    const authorList = [] 
    if ( props.authors ) {
        for ( const  author of props.authors) {
            authorList.push(<UserTag key={author.order} id={author.user.id} />)
        }
    }

    const suggestedAuthorList = []
    if ( request && request.state == 'fulfilled') {
        for ( const [ index, user ] of userSuggestions.entries()) {
            suggestedAuthorList.push(<div key={user.name} onClick={(event) => { appendAuthor(user) }} className={ index == highlightedSuggestion ? "author-suggestion highlighted" : "author-suggestion" }>{user.name}</div>)
        }
    } else if ( request && request.state == 'failed' ) {
        setSuggestionsError(<div className="error">The attempt to retrieve user suggestions from the backend failed with error: { request.error }. Please report this as a bug.</div>)
    }

    return (
        <div className="authors-input field-wrapper"> 
            <label htmlFor="authors">Authors</label>
            <div className="explanation">List the authors of this paper in the order in which they appear on the paper. The order will be preserved.</div>
            <div className="authors">{authorList}</div>
            <input type="text" 
                name="authorName" 
                value={authorName}
                onKeyDown={handleKeyDown}
                onChange={handleChange} 
            />
            <div className="author-suggestions" 
                style={ ( suggestedAuthorList.length > 0 || suggestionsError ? { display: 'block' } : { display: 'none' } ) }
            >
                { suggestionsError }
                { suggestedAuthorList }
            </div>
        </div>
    )

}

export default AuthorsInput
