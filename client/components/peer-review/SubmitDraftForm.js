import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { getAuthentication, cleanupRequest as cleanupAuthenticationRequest } from '../../state/authentication'
import { postPapers, uploadPaper, cleanupRequest as cleanupPaperRequest } from '../../state/papers'
import { queryUsers, newQuery, cleanupRequest as cleanupUserRequest } from '../../state/users'

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
            authors: authors
        }

        setPostPapersRequestId(dispatch(postPapers(paper)))
    }

    const handleCurrentAuthorKeyPress = function(event) {
        if ( event.key == "Enter" ) {
            event.preventDefault()

            if (authorSuggestions.length == 1) {
                setAuthors([ ...authors, authorSuggestions[0]])
                setCurrentAuthor('')
                setAuthorSuggestions([])
            }
        }
    }

    const handleCurrentAuthorChange = function(event) {
        const authorName = event.target.value
        setCurrentAuthor(authorName)

        if ( authorName.length > 0) {
            if ( ! queryUsersRequestId ) {
                dispatch(newQuery())
                setQueryUsersRequestId(dispatch(queryUsers(authorName)))
            } else if( queryUsersRequest && queryUsersRequest.state == 'fulfilled') {
                dispatch(newQuery())
                dispatch(cleanupUserRequest(queryUsersRequestId))
                setQueryUsersRequestId(dispatch(queryUsers(authorName)))
            }

            let newAuthorSuggestions = []
            for(let id in users) {
                if (users[id].name.includes(currentAuthor) ) {
                    newAuthorSuggestions.push(users[id])
                }
            }
            setAuthorSuggestions(newAuthorSuggestions)

        } else {
            setAuthorSuggestions([])
        }

    }

    // ================= Data Fetching and Side Effects =======================

    useEffect(function() {

        if ( postPapersRequest && postPapersRequest.state == 'fulfilled') {
            if ( ! uploadPaperRequest ) {
                const paper = postPapersRequest.result.paper
                setUploadPaperRequestId(dispatch(uploadPaper(paper.id, file)))
            } else if ( uploadPaperRequest.state == 'fulfilled') {
                navigate("/submission/" + paper.id, { replace:true })
            }
        }


        if ( ! currentUser && ! authenticationRequest ) {
            setAuthenticationRequestId(dispatch(getAuthentication()))
        }

        // If we're not logged in, we can't be here.
        if ( ! currentUser && authenticationRequest && authenticationRequest.state == 'fulfilled') {

            navigate("/", { replace: true })
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
    }

    let authorList = [] 
    authors.forEach(function(author) {
        authorList.push(<span key={author.name} className="author">{author.name}</span>)
    })

    let suggestedAuthorList = []
    authorSuggestions.forEach(function(author) {
        suggestedAuthorList.push(<span key={author.name} className="author">{author.name}</span>)
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
                    onChange={handleCurrentAuthorChange} />
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
