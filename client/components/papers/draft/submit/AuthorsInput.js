import React, { useState, useEffect, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { getUsers, clearList, cleanupRequest as cleanupUsersRequest } from '/state/users'

import Spinner from '/components/Spinner'

import './AuthorsInput.css'

const AuthorsInput = function(props) {
    // Local state
    const [authorName, setAuthorName] = useState('')

    const [authorSuggestions, setAuthorSuggestions] = useState([])
    const [highlightedSuggestion, setHighlightedSuggestion] = useState(0)

    // Request Tracking
    const [getUsersRequestId, setGetUsersRequestId] = useState(null)

    const timeoutId = useRef(null)

    // Helpers
    const dispatch = useDispatch()


    const getUsersRequest = useSelector(function(state) {
        if ( ! getUsersRequestId ) {
            return null
        } else {
            return state.users.requests[getUsersRequestId]
        }
    })

    const userList = useSelector(function(state) {
        return state.users.list
    })

    const suggestAuthors = function(name) {
        if ( timeoutId.current ) {
            clearTimeout(timeoutId.current)
        }
        timeoutId.current = setTimeout(function() {
            if ( name.length > 0) {
                if ( ! getUsersRequestId ) {
                    dispatch(clearList())
                    setGetUsersRequestId(dispatch(getUsers({name: name})))
                } else if( getUsersRequest && getUsersRequest.state == 'fulfilled') {
                    dispatch(clearList())
                    dispatch(cleanupUsersRequest(getUsersRequest))
                    setGetUsersRequestId(dispatch(getUsers({ name: name})))
                }

                if ( highlightedSuggestion >= userList.length ) {
                    setHighlightedSuggestion(0)
                }
                setAuthorSuggestions(userList)

            } else {
                dispatch(clearList())
                setHighlightedSuggestion(0)
                setAuthorSuggestions([])
            }
        }, 250)
    }

    const handleChange = function(event) {
        setAuthorName(event.target.value)
        suggestAuthors(event.target.value)
    }

    const appendAuthor = function(user) {
        setAuthorName('')
        setAuthorSuggestions([])

        const author = {
            user: user,
            order: props.authors.length+1,
            owner: false
        }
        props.setAuthors([ ...props.authors,author])
    }

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
            if ( newHighlightedSuggestion >= authorSuggestions.length) {
                newHighlightedSuggestion = authorSuggestions.length-1
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

    useEffect(function() {
        if (getUsersRequest && getUsersRequest.state == 'fulfilled') {
            if ( highlightedSuggestion >= userList.length) {
                setHighlightedSuggestion(0)
            }
            setAuthorSuggestions(userList)
        }


        return function cleanup() {
            if ( getUsersRequest ) {
                dispatch(cleanupUsersRequest(getUsersRequest))
            }
        }
    }, [ getUsersRequest ])

    let authorList = '' 
    for ( const [index, author] of props.authors.entries()) {
        if ( index == 0 ) {
            authorList = `${author.user.name}`
        } else {
            authorList += `, ${author.user.name}`
        }
    }

    let suggestedAuthorList = []
    for ( const [ index, user ] of authorSuggestions.entries()) {
        suggestedAuthorList.push(<div key={user.name} onClick={(event) => { appendAuthor(user) }} className={ index == highlightedSuggestion ? "author-suggestion highlighted" : "author-suggestion" }>{user.name}</div>)
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
                style={ ( suggestedAuthorList.length > 0 ? { display: 'block' } : { display: 'none' } ) }
            >
                {suggestedAuthorList}
            </div>
        </div>
    )

}

export default AuthorsInput
