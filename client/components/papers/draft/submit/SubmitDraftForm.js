import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { postPapers, setDraft, cleanupRequest as cleanupPapersRequest } from '/state/papers'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

import SelectCoAuthorsWidget from './SelectCoAuthorsWidget'
import FieldsInput from '/components/fields/FieldsInput'
import FileUploadInput from '/components/files/FileUploadInput' 
import Field from '/components/fields/Field'
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

    const [titleError, setTitleError] = useState(null)
    const [fieldsError, setFieldsError] = useState(null)
    const [fileError, setFileError] = useState(null)
    const [authorsError, setAuthorsError] = useState(null)

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
     *
     */
    const isValid = function(name) {
        let error = false

        if ( ! name || name == 'title' ) {
            if (title.length <= 0) {
                setTitleError('no-title')
                error = true
            } else if ( titleError ) {
                setTitleError(null)
            }
        }

        if ( ! name || name == 'fields' ) {
            if ( fields.length <= 0 ) {
                setFieldsError('no-fields')
                error = true
            } else if ( fieldsError ) {
                setFieldsError(null)
            }
        }

        if ( ! name || name == 'file' ) {
            if ( ! file ) {
                setFileError('no-file')
                error = true
            } else if ( fileError ) {
                setFileError(null)
            }
        }

        if ( ! name || name == 'authors' ) {
            if ( authors.length <= 0 ) {
                setAuthorsError('no-authors')
                error = true
            } else if ( authorsError ) {
                setAuthorsError(null)
            }
        }

        return ! error
    }

    /**
     * Handle the form's submission by attempting to post the paper.  Store the
     * postPapersRequestId so that we can track the request and respond to
     * errors.
     *
     * @param {Event} event Standard Javascript event object.
     */
    const onSubmit = function(event) {
        event.preventDefault();

        if ( ! isValid() ) {
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

    if ( postPapersRequest && postPapersRequest.state == 'pending') {
        return (
            <Spinner />
        )
    }

    let requestError = null 
    if ( postPapersRequest && postPapersRequest.state == 'failed') {
        let errorContent = 'Something went wrong.' 
        if ( postPapersRequest.error == 'not-authorized:reputation' ) {
            if ( ! postPapersRequest.errorData.missingFields ) {
                throw new Error('Missing data for error.')
            } else {

                const missingFieldViews = []
                for ( const fieldId of postPapersRequest.errorData.missingFields ) {
                    missingFieldViews.push(<span key={fieldId} className="missing-field"><Field id={fieldId} /></span>)
                }
                errorContent = (
                    <>
                        <ExclamationTriangleIcon />
                        <p>No author has enough reputation to publish in the following fields:</p> 
                        {missingFieldViews}
                        <p>Please either add an author with enough reputation to publish, or remove the fields in question.</p>
                        <p><strong>NOTE:</strong> During closed beta, publish reputation has been set at 2x average field reputation.  Once we're out of closed beta and into open beta, this will be set at 0 reputation.</p>
                    </>
                )
            }
        }

        requestError = (
            <div className="overall-error">
                { errorContent }
            </div>
        )
    }


    let titleErrorView = null
    let fieldsErrorView = null
    let authorsErrorView = null
    let fileErrorView = null

    if ( titleError && titleError == 'no-title' ) {
        titleErrorView = ( <div className="error">Must include a title.</div> )
    }

    if ( fieldsError && fieldsError == 'no-fields' ) {
        fieldsErrorView = ( <div className="error">Must select at least one field.</div> )
    }

    if ( fileError && fileError == 'no-file' ) {
        fileErrorView = ( <div className="error">Must select a valid file.</div> )
    }

    if ( authorsError && authorsError == 'no-authors' ) {
        authorsErrorView = ( <div className="error">Must select at least one author.</div> )
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
                        onBlur={ (event) => isValid('title') }
                        onChange={ (event) => setTitle(event.target.value) } 
                    />
                    { titleErrorView }
                </div>

                <FieldsInput 
                    onBlur={ (event) => isValid('fields') }
                    fields={fields} 
                    setFields={setFields} 
                    title="Fields"
                    explanation={`Enter up to five fields, subfields, or areas you believe your paper is relevant to, eg. "biology", "chemistry", or "microbiology.`}
                />
                { fieldsErrorView }

                <SelectCoAuthorsWidget 
                    onBlur={ (event) => isValid('authors') }
                    fields={fields} 
                    authors={authors} 
                    setAuthors={setAuthors} 
                />
                { authorsErrorView }

                <FileUploadInput setFile={setFile} types={[ 'application/pdf' ]}/>
                { fileErrorView }

                { requestError }
                <div className="submit field-wrapper">
                    <input type="submit" name="submit-draft" value="Submit Draft for Pre-publish Review" />
                </div>
            </form>
        </div>
    )
}

export default SubmitDraftForm 
