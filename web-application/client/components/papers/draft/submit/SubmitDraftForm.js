import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'


import { postPapers, cleanupRequest as cleanupPapersRequest } from '/state/papers'
import { postJournalSubmissions, cleanupRequest as cleanupSubmissionRequest } from '/state/journalSubmissions'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

import SelectCoAuthorsWidget from './SelectCoAuthorsWidget'
import FieldsInput from '/components/fields/FieldsInput'
import FileUploadInput from '/components/files/FileUploadInput' 
import JournalSelectionInput from './JournalSelectionInput'
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
    const [showPreprint, setShowPreprint] = useState(false)
    const [selectedJournalId, setSelectedJournalId] = useState(null)

    const [titleError, setTitleError] = useState(null)
    const [fieldsError, setFieldsError] = useState(null)
    const [fileError, setFileError] = useState(null)
    const [authorsError, setAuthorsError] = useState(null)
    const [preprintError, setPreprintError] = useState(null)
    const [journalError, setJournalError ] = useState(null)

    // ================== Request Tracking ====================================
    
    const [postPapersRequestId, setPostPapersRequestId] = useState(null)
    const postPapersRequest = useSelector(function(state) {
        if (postPapersRequestId) {
            return state.papers.requests[postPapersRequestId]
        } else {
            return null
        }
    })

    const [postJournalSubmissionsRequestId, setPostJournalSubmissionRequestId] = useState(null)
    const postJournalSubmissionsRequest = useSelector(function(state) {
        if ( postJournalSubmissionsRequestId) {
            return state.journalSubmissions.requests[postJournalSubmissionsRequestId]
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

        if ( ! name || name == 'showPreprint' ) {
            if (  showPreprint !== false && showPreprint !== true ) {
                setPreprintError('invalid-value')
            } else {
                setPreprintError(null)
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
            showPreprint: showPreprint,
            fields: fields,
            authors: authors,
            versions: [
                {
                    file: file
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
                userId: currentUser.id,
                order: 1,
                owner: true,
                submitter: true
            }
            setAuthors([ author ])
        }
    }, [ currentUser ])

    useEffect(function() {
        if ( postPapersRequest && postPapersRequest.state == 'fulfilled') {
            if ( ! selectedJournalId) {
                const path = "/paper/" + postPapersRequest.result.entity.id
                navigate(path)
            } else {
                setPostJournalSubmissionRequestId(dispatch(postJournalSubmissions(selectedJournalId, { paperId: postPapersRequest.result.entity.id })))
            }
        }

    }, [ postPapersRequest] )

    useEffect(function() {
        if ( postJournalSubmissionsRequest && postJournalSubmissionsRequest.state == 'fulfilled') {
            const path = `/paper/${postPapersRequest.result.entity.id}`
            navigate(path)
        }
    }, [ postJournalSubmissionsRequest ])

    useEffect(function() {
        return function cleanup() {
            if ( postPapersRequestId ) {
                dispatch(cleanupPapersRequest({ requestId: postPapersRequestId }))
            }
        }
    }, [ postPapersRequestId]) 


    // ====================== Render ==========================================

    let requestError = null 
    if ( postPapersRequest && postPapersRequest.state == 'failed') {
        let errorContent = 'Something went wrong.' 

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
    let preprintErrorView = null

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

    if ( preprintError && preprintError == 'invalid-value' ) {
        preprintErrorView = ( <div className="error">Show Preprint must be either "yes" or "no".</div> )
    }


    let spinning = null
    if ( postPapersRequest && postPapersRequest.state == 'pending') {
        spinning = ( <Spinner local={true} /> )
    }

    return (
        <div className="draft-paper-submission-form">
            <h2>Submit a Paper</h2>
            <form onSubmit={onSubmit}>

                <div className="title field-wrapper">
                    <h3>Title</h3>
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
                    title="Taxonomy Tags"
                    explanation={`Select tags from the taxonomy to categorize your paper.  You may select as many as you think appropriate. The taxonomy is heirarchical. At the top are the major disciplines (eg. biology, art, philosophy).  As you travel down there are sub-disciplines, topics, concepts, and keywords.  You can tag your paper from any layer(s) of the hierarchy.  This will help identify appropriate reviewers and also help interested readers discover your paper. Start typing to view suggestions.`}
                />
                { fieldsErrorView }

                <SelectCoAuthorsWidget 
                    onBlur={ (event) => isValid('authors') }
                    fields={fields} 
                    authors={authors} 
                    setAuthors={setAuthors} 
                />
                { authorsErrorView }

                <FileUploadInput file={file} setFile={setFile} types={[ 'application/pdf' ]}/>
                { fileErrorView }

                <div className="preprint field-wrapper">
                    <h3>Show Preprint</h3>
                    <div className="explanation">Show a preprint of this paper and solicit feedback from your peers.  Draft versions of this paper will be shown on the review screen as a preprint and your peers will be able to give you detailed review feedback.  You can choose to submit this paper to a journal now alongside showing the preprint, or later after you've recieved one or more rounds of preprint feedback.</div>
                    <label htmlFor="preprint">Show preprint?</label>
                    <input type="checkbox"
                        name="preprint"
                        checked={showPreprint}
                        onBlur={ (event) => isValid('preprint') }
                        onChange={ (event) => { setShowPreprint(!showPreprint) } }
                    />
                    { preprintErrorView }
                </div>

                <JournalSelectionInput 
                    label={'Select a Journal'}
                    explanation={'Select a journal to submit this paper to.  You may leave this selection blank and submit this paper to a journal after collecting co-author and/or preprint feedback.'}
                    onBlur={ (event) => isValid('journal') }
                    selectedJournalId={selectedJournalId}
                    setSelectedJournalId={setSelectedJournalId}
                />

                { requestError }
                <div className="submit field-wrapper">
                    { spinning && spinning }
                    { ! spinning && <input type="submit" name="submit-draft" value="Submit Paper" /> }
                </div>
            </form>
        </div>
    )
}

export default SubmitDraftForm 
