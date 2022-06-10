import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { postPapers, uploadPaper, cleanupRequest as cleanupPapersRequest } from '../../state/papers'

import AuthorsInput from './AuthorsInput'
import FieldsInput from './FieldsInput'
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
    const [fields, setFields] = useState([])

    const [paper, setPaper] = useState(null)


    // ================== Request Tracking ====================================
    
    const [postPapersRequestId, setPostPapersRequestId] = useState(null)
    const [uploadPaperRequestId, setUploadPaperRequestId] = useState(null)


    // ============= Helpers ==================================================

    const dispatch = useDispatch()
    const navigate = useNavigate()


    // ============= Collect State from Redux =================================

    // ============= Requests =================================================
    


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
            authors: authors,
            fields: fields
        }

        setPaper(paper)

        setPostPapersRequestId(dispatch(postPapers(paper)))

        return false
    }


    // ================= Data Fetching and Side Effects =======================

    useEffect(function() {
        // If we're not logged in, we can't be here.
        if ( ! currentUser ) {

            navigate("/", { replace: true })
        }
    }, [ currentUser ])

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

        if ( postPapersRequest && postPapersRequest.state == 'fulfilled') {
            if ( ! uploadPaperRequest ) {
                const paper = postPapersRequest.result
                setPaper(paper)
                setUploadPaperRequestId(dispatch(uploadPaper(paper.id, file)))
            } else if ( uploadPaperRequest.state == 'fulfilled') {
                const path = "/submission/" + paper.id
                navigate(path)
            }
        }

        return function cleanup() {
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

    return (
        <form onSubmit={onSubmit}>

            <div className="title">
                <label htmlFor="title">Title:</label>
                <input type="text" 
                    name="title" 
                    value={title}
                    onChange={ (event) => setTitle(event.target.value) } />
            </div>

            <AuthorsInput authors={authors} setAuthors={setAuthors} />
            <FieldsInput fields={fields} setFields={setFields} />

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
