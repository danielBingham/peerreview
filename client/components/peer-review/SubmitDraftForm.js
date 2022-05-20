import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import debounce from 'lodash.debounce'

import { getAuthentication, cleanupRequest as cleanupAuthenticationRequest } from '../../state/authentication'
import { postPapers, uploadPaper, cleanupRequest as cleanupPapersRequest } from '../../state/papers'
import { queryUsers, newQuery, cleanupRequest as cleanupUsersRequest } from '../../state/users'

import Spinner from '../Spinner'

/**
 * A login form allowing the user to postAuthentication using an email and a password.
 *
 * @param {object} props - An empty object, takes no props.
 */
const SubmitDraftForm = function(props) { 

    // ================ State used in Rendering ===============================
    const [title, setTitle] = useState('')
    const [file, setFile] = useState(null)
    const [authors, setAuthors] = useState([])

    const [currentAuthor, setCurrentAuthor] = useState('')
    const [authorSuggestions, setAuthorSuggestions] = useState([])

    const [paper, setPaper] = useState(null)


    // ================== Request Tracking ====================================
    
    const [authenticationRequestId, setAuthenticationRequestId] = useState(null)
    const [queryUsersRequestId, setQueryUsersRequestId] = useState(null)
    const [postPapersRequestId, setPostPapersRequestId] = useState(null)
    const [uploadPaperRequestId, setUploadPaperRequestId] = useState(null)


    // ============= Helpers ==================================================

    const dispatch = useDispatch()
    const navigate = useNavigate()


    // ============= Collect State from Redux =================================

    // ============= Requests =================================================
    

    const authenticationRequest = useSelector(function(state) {
        if ( ! authenticationRequestId ) {
            return null
        } else {
            return state.authentication.requests[authenticationRequestId]
        }
    })

    const queryUsersRequest = useSelector(function(state) {
        if ( ! queryUsersRequestId ) {
            return null
        } else {
            return state.users.requests[queryUsersRequestId]
        }
    })

    const postPapersRequest = useSelector(function(state) {
        if (postPapersRequestId) {
            return state.papers.requests[postPapersRequestId]
        } else {
            return null
        }
    })

    const uploadPaperRequest = useSelector(function(state) {
        if ( uploadPaperRequestId ) {
            return state.papers.requests[uploadPaperRequestId]
        } else {
            return null
        }
    })

    // ================= State ================================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const users = useSelector(function(state) {
        return state.users.users
    })

    // =========== Event Handling Methods =====================================

    /**
     * Handle the form's submission by attempting to post the paper. 
     * Store the postPapersRequestId so that we can track the request and respond to
     * errors.
     */
    const onSubmit = function(event) {
        event.preventDefault();

        const paper = {
            title: title,
            isDraft: true,
            authors: authors
        }

        setPaper(paper)

        setPostPapersRequestId(dispatch(postPapers(paper)))

        return false
    }

    const handleCurrentAuthorKeyPress = function(event) {
        if ( event.key == "Enter" ) {
            event.preventDefault()

            if (authorSuggestions.length == 1) {
                const author = {
                    user: authorSuggestions[0],
                    order: authors.length+1,
                    owner: false
                }

                setAuthors([ ...authors,author])
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

    // ================= Data Fetching and Side Effects =======================
    
    useEffect(function() {
        if ( ! currentUser && ! authenticationRequest ) {
            setAuthenticationRequestId(dispatch(getAuthentication()))
        }

        return function cleanup() {
            if ( authenticationRequest ) {
                dispatch(cleanupAuthenticationRequest(authenticationRequestId))
            }
        }
    }, [])

    useEffect(function() {
        // If we're not logged in, we can't be here.
        if ( ! currentUser && authenticationRequest && authenticationRequest.state == 'fulfilled') {

            navigate("/", { replace: true })
        }
    }, [ currentUser, authenticationRequest ])

    useEffect(function() {
        if ( currentUser && authors.length == 0) {
            // TODO There will come a day when we want to allow the submitting
            // author to not be first author, or for authors to be re-ordered
            // easily.  But it is not this day.
            const author = {
                user: currentUser,
                order: 1,
                owner: true
            }
            setAuthors([ author ])
        }
    }, [ currentUser, authors ])

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
    }, [ queryUsersRequest ])

    useEffect(function() {

        if ( postPapersRequest && postPapersRequest.state == 'fulfilled') {
            console.log('Post Papers request is finished.')
            if ( ! uploadPaperRequest ) {
                console.log('Triggering upload paper.')
                const paper = postPapersRequest.result
                setPaper(paper)
                setUploadPaperRequestId(dispatch(uploadPaper(paper.id, file)))
            } else if ( uploadPaperRequest.state == 'fulfilled') {
                console.log('Upload paper request is finished.')
                const path = "/submission/" + paper.id
                navigate(path)
            }
        }

        return function cleanup() {
            if ( queryUsersRequest ) {
                dispatch(cleanupUsersRequest(queryUsersRequestId))
            }

            if ( postPapersRequest ) {
                dispatch(cleanupPapersRequest(postPapersRequestId))
            }

            if ( uploadPaperRequest ) {
                dispatch(cleanupPapersRequest(uploadPaperRequestId))
            }

        }
    })


    // ====================== Render ==========================================

    // If we're not logged in, we don't want to render the form at all. Show a
    // spinner and navigate away.  Alternatively, we've requested the current
    // user and we're waiting for the request to return.
    if ( ! currentUser ) {
        return (
            <Spinner />
        )
    } else if ( postPapersRequest || uploadPaperRequest ) {
        return (
            <Spinner />
        )
    }

    let authorList = [] 
    authors.forEach(function(author) {
        authorList.push(<span key={author.user.name} className="author">{author.user.name}</span>)
    })

    let suggestedAuthorList = []
    authorSuggestions.forEach(function(user) {
        suggestedAuthorList.push(<span key={user.name} className="author">{user.name}</span>)
    })

    return (
        <form onSubmit={onSubmit}>

            <div className="title">
                <label htmlFor="title">Title:</label>
                <input type="text" 
                    name="title" 
                    value={title}
                    onChange={ (event) => setTitle(event.target.value) } />
            </div>

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

            <div className="upload">
                <label htmlFor="upload">Select a file to upload:</label>
                <input type="file"
                    name="paper"
                    onChange={(event) => setFile(event.target.files[0])} />
            </div>

            <input type="submit" name="submit-draft" value="Submit Draft for Peer Review" />
        </form>
    )
}

export default SubmitDraftForm 
