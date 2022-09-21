import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { postPapers, setDraft, cleanupRequest as cleanupPapersRequest } from '/state/papers'

import SelectCoAuthorsWidget from './SelectCoAuthorsWidget'
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

    // ================ Render State ================================
    const [title, setTitle] = useState('')
    const [fields, setFields] = useState([])
    const [file, setFile] = useState(null)
    const [authors, setAuthors] = useState([])

    const [errors, setErrors] = useState([])

    // ================== Request Tracking ====================================
    
    const [postPapersRequestId, setPostPapersRequestId] = useState(null)
    const postPapersRequest = useSelector(function(state) {
        if (postPapersRequestId) {
            return state.papers.requests[postPapersRequestId]
        } else {
            return null
        }
    })

    // ================= Redux State ================================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    // =========== Actions and Event Handling =====================================

    const dispatch = useDispatch()
    const navigate = useNavigate()

    /**
     * Handle the form's submission by attempting to post the paper.  Store the
     * postPapersRequestId so that we can track the request and respond to
     * errors.
     *
     * @param {Event} event Standard Javascript event object.
     */
    const onSubmit = function(event) {
        event.preventDefault();

        const foundErrors = []
        if ( ! title ) {
           foundErrors.push('missing-title') 
        }
        if (foundErrors.length > 0) {
            setErrors(foundErrors)
            return false
        }

        const paper = {
            title: title,
            isDraft: true,
            fields: fields,
            authors: authors,
            versions: [
                {
                    file: file,
                    isPublished: false
                }
            ]

        }
        setPostPapersRequestId(dispatch(postPapers(paper)))

        return false
    }


    // ================= Effect Handling =======================

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
    }, [ currentUser ])

    useEffect(function() {
        if ( postPapersRequest && postPapersRequest.state == 'fulfilled') {
            const path = "/draft/" + postPapersRequest.result.id
            navigate(path)
        }

    }, [ postPapersRequest] )

    useEffect(function() {
        return function cleanup() {
            if ( postPapersRequestId ) {
                dispatch(cleanupPapersRequest({ requestId: postPapersRequestId }))
            }
        }
    }, [ postPapersRequestId]) 


    // ====================== Render ==========================================

    if ( postPapersRequest ) {
        return (
            <Spinner />
        )
    }

    let titleErrorElement = null
    if ( errors ) {
        for ( const error of errors ) {
            if ( error == 'missing-title' ) {
                titleErrorElement = ( <div className="error">Title is required!</div> )
            }
        }
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
                        onChange={ (event) => setTitle(event.target.value) } 
                    />
                    { titleErrorElement }
                </div>

                <FieldsInput 
                    fields={fields} 
                    setFields={setFields} 
                    title="Fields"
                    explanation={`Enter up to five fields, subfields, or areas you believe your paper is relevant to, eg. "biology", "chemistry", or "microbiology.`}
                />

                <SelectCoAuthorsWidget fields={fields} authors={authors} setAuthors={setAuthors} />

                <FileUploadInput setFile={setFile} />

                <div className="submit field-wrapper">
                    <input type="submit" name="submit-draft" value="Submit Draft for Pre-publish Review" />
                </div>
            </form>
        </div>
    )
}

export default SubmitDraftForm 
