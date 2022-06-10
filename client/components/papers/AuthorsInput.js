import React, { useState, useEffect } from 'react'

import debounce from 'lodash.debounce'

import { useDispatch, useSelector } from 'react-redux'

import { queryUsers, newQuery, cleanupRequest as cleanupUsersRequest } from '../../state/users'

import Spinner from '../Spinner'

const AuthorsInput = function(props) {

    // Local state
    const [currentAuthor, setCurrentAuthor] = useState('')
    const [authorSuggestions, setAuthorSuggestions] = useState([])

    // Request Tracking
    const [queryUsersRequestId, setQueryUsersRequestId] = useState(null)

    // Helpers
    const dispatch = useDispatch()


    const queryUsersRequest = useSelector(function(state) {
        if ( ! queryUsersRequestId ) {
            return null
        } else {
            return state.users.requests[queryUsersRequestId]
        }
    })

    const users = useSelector(function(state) {
        return state.users.users
    })

    const handleCurrentAuthorKeyPress = function(event) {
        if ( event.key == "Enter" ) {
            event.preventDefault()

            if (authorSuggestions.length == 1) {
                const author = {
                    user: authorSuggestions[0],
                    order: props.authors.length+1,
                    owner: false
                }

                props.setAuthors([ ...props.authors,author])
                setCurrentAuthor('')
                setAuthorSuggestions([])
            }
        }
    }

    const suggestAuthors = debounce(function(authorName) {
        if ( authorName.length > 0) {
            if ( ! queryUsersRequestId ) {
                dispatch(newQuery())
                setQueryUsersRequestId(dispatch(queryUsers(authorName)))
            } else if( queryUsersRequest && queryUsersRequest.state == 'fulfilled') {
                dispatch(newQuery())
                dispatch(cleanupUsersRequest(queryUsersRequestId))
                setQueryUsersRequestId(dispatch(queryUsers(authorName)))
            }

            let newAuthorSuggestions = []
            for(let id in users) {
                if (users[id].name.toLowerCase().includes(currentAuthor.toLowerCase()) ) {
                    newAuthorSuggestions.push(users[id])
                }
            }
            setAuthorSuggestions(newAuthorSuggestions)

        } else {
            setAuthorSuggestions([])
        }

    }, 250)


    useEffect(function() {
        if (queryUsersRequest && queryUsersRequest.state == 'fulfilled') {
            let newAuthorSuggestions = []
            for(let id in users) {
                if (users[id].name.toLowerCase().includes(currentAuthor.toLowerCase()) ) {
                    newAuthorSuggestions.push(users[id])
                }
            }
            setAuthorSuggestions(newAuthorSuggestions)
        }

        return function cleanup() {
            if ( queryUsersRequest ) {
                dispatch(cleanupUsersRequest(queryUsersRequestId))
            }
        }
    }, [ queryUsersRequest ])

    let authorList = [] 
    props.authors.forEach(function(author) {
        authorList.push(<span key={author.user.name} className="author">{author.user.name}</span>)
    })

    let suggestedAuthorList = []
    authorSuggestions.forEach(function(user) {
        suggestedAuthorList.push(<span key={user.name} className="author">{user.name}</span>)
    })

    return (
        <div className="authors"> 
            <label htmlFor="authors">Authors:</label>
            <input type="text" 
                name="authors" 
                value={currentAuthor}
                onKeyPress={handleCurrentAuthorKeyPress} 
                onChange={(event) => {
                    suggestAuthors(event.target.value)
                    setCurrentAuthor(event.target.value)
                }} />
            <div className="author-suggestions">{suggestedAuthorList}</div>
            <div className="selected-authors">{authorList}</div>
        </div>
    )

}

export default AuthorsInput
