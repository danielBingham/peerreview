import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'

import { postPaperVersions, loadFiles, cleanupRequest } from '/state/paperVersions'

import FileUploadInput from '/components/files/FileUploadInput'

import './UploadPaperVersionForm.css'

/**
 * @see `/server/daos/papers.js::hydratePapers()` for the structure of the
 * `paper` object.
 */

/**
 * Provides a form allowing the owning author of a paper to upload a file
 * representing a new version of that paper.
 *
 * @param {object} props    The standard React props object.
 * @param {object} props.paper  The paper we're uploading a new version of.
 */
const UploadPaperVersionForm = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================
    
    const [file, setFile] = useState(null)
    const [error, setError] = useState(null)

    // ======= Request Tracking =====================================

    const [requestId, setRequestId] = useState(null)

    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.paperVersions.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()
    const navigate = useNavigate()

    /**
     * An event handler tied to the `submit` event of a form.  Handles the
     * submission of the version upload form by submitting the new version to
     * the backend.  Assumes the file has already been uploaded to the backend
     * and stored in the `files` table.
     *
     * @param {Event} event The standard javascript form submission event.
     */
    const onSubmit = function(event) {
        event.preventDefault()

        if ( file ) {

            const version = {
                file: file
            }

            setRequestId(dispatch(postPaperVersions(props.paper.id, version)))
        } else {
            setError('no-file')
        }

        return false
    }

    // ======= Effect Handling ======================================

    /**
     * Validation checks on mount:
     *
     * Paper must be a draft.  If it's not, log an error and take us out of
     * here.
     *
     */
    useEffect(function() {
        if ( ! props.paper.isDraft ) {
            console.error('Attempt to upload a new version to a published paper.  This is invalid.')
            navigate("/")
        }
    }, [])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    /**
     * Handle the completion of the request by either directing back to the
     * draft paper for this paper or handling the error of a failed request.
     */
    useEffect(function() {
        if ( request && request.state == 'fulfilled') {
            // Reset the search params before we load the new file.
            searchParams.delete('review')
            searchParams.delete('thread')
            setSearchParams(searchParams)

            dispatch(loadFiles(props.paper.id))

            if ( props.close ) {
                props.close()
            } else {
                const draftUri = `/paper/${props.paper.id}/`
                navigate(draftUri)
            }
        } else if ( request && request.state == 'failed' ) {
            setError(<div className="request-error">{ request.error }</div>)
        }
    }, [ request ])

    // ======= Render ===============================================


    if ( props.paper.isDraft ) {
        let errorView = null
        if ( error == 'no-file' ) {
            errorView = (<div className="no-file-error">You must select a file to upload.</div>)
}

        return (
            <div  className="upload-paper-version-form">
                <form onSubmit={onSubmit}>
                    <FileUploadInput setFile={setFile} types={[ 'application/pdf' ]} />
                    <div className="error">{ errorView }</div>
                    <div className="submit">
                        <input type="submit" name="submit" value="Submit New Version" />
                    </div>
                </form>
            </div>
        )
    } else {
        return ( <div className="error">You may only upload a new version to a draft of a paper.</div> )
    }

}

export default UploadPaperVersionForm 
