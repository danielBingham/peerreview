import React, { useState, useEffect, useLayoutEffect } from 'react'

import debounce from 'lodash.debounce'

import { useDispatch, useSelector } from 'react-redux'

import { queryUsers, newQuery, cleanupRequest as cleanupUsersRequest } from '/state/users'

import Spinner from '/components/Spinner'

import './AuthorsInput.css'

const AuthorsInput = function(props) {

    // Local state
    const [authors, setAuthors] = useState('')
    const [authorSuggestions, setAuthorSuggestions] = useState([])

    // Request Tracking
    const [queryUsersRequestId, setQueryUsersRequestId] = useState(null)

    console.log('#### AuthorsInput ####')
    console.log('Props')
    console.log(props)
    console.log('authors')
    console.log(authors)
    console.log('AuthorSuggestions')
    console.log(authorSuggestions)
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
        console.log('=== handleCurrentAuthorKeyPress ===')
        if ( event.key == "Enter" ) {
            console.log('Enter pressed.')
            event.preventDefault()

            const suggestionsWrappers = document.getElementsByClassName('author-suggestions')
            const suggestions = suggestionsWrappers[0].children
            if (suggestions.length > 0) {
                suggestions[0].click()
            }
        }
        console.log('=== END handleCurrentAuthorKeyPress ===')
    }

    const appendAuthor = function(user) {
        const lastCommaIndex = authors.lastIndexOf(', ')
        let newAuthors = authors.substring(0, lastCommaIndex)
        newAuthors += `, ${user.name}`
        setAuthors(newAuthors)
        setAuthorSuggestions([])

        const author = {
            user: user,
            order: props.authors.length+1,
            owner: false
        }
        props.setAuthors([ ...props.authors,author])
    }

    const suggestAuthors = debounce(function(authorList) {
        console.log('=== SuggestAuthors ===')
        const lastCommaIndex = authorList.lastIndexOf(', ')
        const authorName = authorList.substring(lastCommaIndex+2)
        console.log('Suggest Authors')
        console.log('AuthorList')
        console.log(authorList)
        console.log('LastCommaIndex')
        console.log(lastCommaIndex)
        console.log('authorName')
        console.log(authorName)

        if ( authorName.length > 0) {
            if ( ! queryUsersRequestId ) {
                dispatch(newQuery())
                setQueryUsersRequestId(dispatch(queryUsers(authorName)))
            } else if( queryUsersRequest && queryUsersRequest.state == 'fulfilled') {
                dispatch(newQuery())
                dispatch(cleanupUsersRequest(queryUsersRequestId))
                setQueryUsersRequestId(dispatch(queryUsers(authorName)))
            }

            console.log('Building suggestions.')
            console.log('Users')
            console.log(users)
            console.log('Author Name')
            console.log(authorName)
            let newAuthorSuggestions = []
            for(let id in users) {
                if (users[id].name.toLowerCase().includes(authorName.toLowerCase()) ) {
                    newAuthorSuggestions.push(users[id])
                }
            }
            console.log('AuthorSuggestions')
            console.log(newAuthorSuggestions)
            setAuthorSuggestions(newAuthorSuggestions)

        } else {
            console.log('Wiping suggestions.')
            setAuthorSuggestions([])
        }

        console.log('=== END suggestAuthors ===')

    }, 250)

    useLayoutEffect(function() {
        console.log('=== LAYOUT EFFECT(AuthorsInput) ===')
        console.log(props.authors)
        let authorList = '' 
        for ( const author of props.authors) {
            if ( author.user.id == props.authors[0].user.id ) {
                authorList = `${author.user.name}`
            } else {
                authorList += `, ${author.user.name}`
            }
        }
        console.log(`Setting authorList to "${authorList}"`)
        setAuthors(authorList)
        console.log('=== END LAYOUT EFFECT ===')
    }, [ props.authors ])


    useEffect(function() {
        console.log('=== EFFECT(AuthorsInput) - Query returned. ===')
        if (queryUsersRequest && queryUsersRequest.state == 'fulfilled') {
            const lastCommaIndex = authors.lastIndexOf(', ')
            const authorName = authors.substring(lastCommaIndex+2)

            console.log('Building suggestions.')
            console.log('users')
            console.log(users)
            console.log('authorName')
            console.log(authorName)
            let newAuthorSuggestions = []
            if ( authorName.length > 0) {
                for(let id in users) {
                    if (users[id].name.toLowerCase().includes(authorName.toLowerCase()) ) {
                        newAuthorSuggestions.push(users[id])
                    }
                }
            }
            console.log('NewAuthorSuggestions')
            console.log(newAuthorSuggestions)
            setAuthorSuggestions(newAuthorSuggestions)
        }

        console.log('=== END EFFECT - Query Returned ===')

        return function cleanup() {
            if ( queryUsersRequest ) {
                dispatch(cleanupUsersRequest(queryUsersRequestId))
            }
        }
    }, [ queryUsersRequest ])


    let suggestedAuthorList = []
    authorSuggestions.forEach(function(user) {
        suggestedAuthorList.push(<div key={user.name} onClick={(event) => { appendAuthor(user) }} className="author-suggestion">{user.name}</div>)
    })

    console.log('Rendering')
    console.log('Authors')
    console.log(authors)
    console.log('Author Suggestions')
    console.log(authorSuggestions)
    return (
        <div className="authors-input field-wrapper"> 
            <label htmlFor="authors">Authors</label>
            <div className="explanation">List the authors of this paper in the order in which they appear on the paper. The order will be preserved.</div>
            <input type="text" 
                name="authors" 
                value={authors}
                onKeyPress={handleCurrentAuthorKeyPress} 
                onChange={(event) => {
                    suggestAuthors(event.target.value)
                    setAuthors(event.target.value)
                }} />
            <div className="author-suggestions" style={ ( suggestedAuthorList.length > 0 ? { display: 'block' } : { display: 'none' } ) }>{suggestedAuthorList}</div>
        </div>
    )

}

export default AuthorsInput
