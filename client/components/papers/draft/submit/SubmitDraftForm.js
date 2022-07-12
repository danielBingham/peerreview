import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { postPapers, uploadPaper, cleanupRequest as cleanupPapersRequest } from '/state/papers'

import AuthorsInput from './AuthorsInput'
import FieldsInput from '/components/fields/FieldsInput'
import FileUploadInput from '/components/files/FileUploadInput' 
import Spinner from '/components/Spinner'

import './SubmitDraftForm.css'

/**
 * A login form allowing the user to postAuthentication using an email and a password.
 *
 * @param {object} props - An empty object, takes no props.
 */
const SubmitDraftForm = function(props) { 

    // ================ State used in Rendering ===============================
    const [title, setTitle] = useState('')
    const [authors, setAuthors] = useState([])
    const [fields, setFields] = useState([])
    const [file, setFile] = useState(null)

    // ================== Request Tracking ====================================
    
    const [postPapersRequestId, setPostPapersRequestId] = useState(null)

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
            fields: fields,
            versions: [
                {
                    file_id: file.id
                }
            ]

        }

        setPostPapersRequestId(dispatch(postPapers(paper)))

        return false
    }


    // ================= Data Fetching and Side Effects =======================

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
            const path = "/draft/" + postPapersRequest.result.id
            navigate(path)
        }

        return function cleanup() {
            if ( postPapersRequest ) {
                dispatch(cleanupPapersRequest(postPapersRequest))
            }
        }
    }, [ postPapersRequest] )


    // ====================== Render ==========================================

    // If we're not logged in, we don't want to render the form at all. Show a
    // spinner and navigate away.  Alternatively, we've requested the current
    // user and we're waiting for the request to return.
    if ( ! currentUser ) {
        return (
            <Spinner />
        )
    } else if ( postPapersRequest ) {
        return (
            <Spinner />
        )
    }

    return (
        <div className="draft-paper-submission-form">
            <h2>Submit a Paper</h2>
            <form onSubmit={onSubmit}>

                <div className="title field-wrapper">
                    <label htmlFor="title">Title</label>
                    <div className="explanation">Enter the title of your paper. It should match the title you use in the document.</div>
                    <input type="text" 
                        name="title" 
                        value={title}
                        onChange={ (event) => setTitle(event.target.value) } />
                </div>

                <AuthorsInput authors={authors} setAuthors={setAuthors} />
                <FieldsInput 
                    fields={fields} 
                    setFields={setFields} 
                    title="Fields"
                    explanation={`Enter up to five fields, subfields, or areas you believe your paper is relevant to, eg. "biology", "chemistry", or "microbiology.`}
                />

                <FileUploadInput setFile={setFile} />

                <div className="submit field-wrapper">
                    <input type="submit" name="submit-draft" value="Submit Draft for Peer Review" />
                </div>
            </form>
        </div>
    )
}

export default SubmitDraftForm 
