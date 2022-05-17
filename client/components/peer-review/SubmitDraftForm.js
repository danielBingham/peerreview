import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { getAuthentication } from '../../state/authentication'
import { postPapers } from '../../state/papers'

import Spinner from '../Spinner'

/**
 * A login form allowing the user to postAuthentication using an email and a password.
 *
 * @param {object} props - An empty object, takes no props.
 */
const SubmitDraftForm = function(props) { 
    const [title, setTitle] = useState('')
    const [currentAuthor, setCurrentAuthor] = useState('')
    const [authors, setAuthors] = useState([])
    const [requestId, setRequestId] = useState(null)
    const [authenticationRequestId, setAuthenticationRequestId] = useState(null)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const request = useSelector(function(state) {
        if (requestId) {
            return state.papers.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const authenticationRequest = useSelector(function(state) {
        if ( ! authenticationRequestId ) {
            return null
        } else {
            return state.authentication.requests[authenticationRequestId]
        }
    })

    const users = useSelector(function(state) {
        return state.users.users
    })

    if ( ! currentUser && ! authenticationRequest ) {
        setAuthenticationRequestId(dispatch(getAuthentication()))
    }


    /**
     * Handle the form's submission by attempting to post the paper. 
     * Store the requestId so that we can track the request and respond to
     * errors.
     */
    const onSubmit = function(event) {
        event.preventDefault();

        setRequestId(dispatch(postPapers(paper)))
    }

    const handleCurrentAuthorChange = function(event) {

    }

    const handleUpload = function(event) {

    }

    // Make sure to do our cleanup in a useEffect so that we do it after
    // rendering.
    useEffect(function() {
        // If we're not logged in, we can't be here.
        if ( ! currentUser && ! authenticationRequest) {
            navigate("/", { replace: true })
        }
    })

    // ====================== Render ==========================================

    // If we're not logged in, we don't want to render the form at all. Show a
    // spinner and navigate away.
    if ( ! currentUser ) {
        return (
            <Spinner />
        )
    }

    // Show a spinner if the request we made is still in progress.
    if (request && request.state == 'pending') {
        return (
            <Spinner />
        )
    }

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
                    onChange={handleCurrentAuthorChange} />
                <div className="author-suggestions"></div>
                <div className="selected-authors">{authors}</div>
            </div>

            <div className="upload">
                <label htmlFor="upload">Select a file to upload:</label>
                <input type="file"
                    name="paper"
                    onChange={handleUpload} />
            </div>

            <input type="submit" name="submit-draft" value="Submit Draft for Peer Review" />
        </form>
    )
}

export default SubmitDraftForm 
