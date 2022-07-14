import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { DocumentTextIcon } from '@heroicons/react/outline'
import { XCircleIcon } from '@heroicons/react/solid'

import { uploadFile, deleteFile, cleanupRequest } from '/state/files'

import Spinner from '/components/Spinner'

import './FileUploadInput.css'

/**
 *
 * TODO If a page showing this component is reloaded after a file has been
 * chosen, that file is left hanging in the database and on disk.  It's
 * effectively orphaned.  We should fix that.
 */
const FileUploadInput = function(props) {
    console.log('\n\n ###### FileUploadInput #####')
    // ============ Render State ====================================
  
    const [file, setFile] = useState(null)
    const [fileData, setFileData] = useState(null)

    // ============ Request Tracking ================================
   
    const [uploadRequestId, setUploadRequestId] = useState(null)
    const [deleteRequestId, setDeleteRequestId] = useState(null)

    console.log('State')
    console.log('File: ')
    console.log(file)
    console.log('FileData: ')
    console.log(fileData)

    console.log('Request State')
    console.log('uploadRequestId: ' + uploadRequestId)
    console.log('deleteRequestId: ' + deleteRequestId)
   
    const uploadRequest = useSelector(function(state) {
        if ( uploadRequestId) {
            return state.files.requests[uploadRequestId]
        } else {
            return null
        }
    })

    console.log('uploadRequest')
    console.log(uploadRequest)

    const deleteRequest = useSelector(function(state) {
        if ( deleteRequestId ) {
            return state.files.requests[deleteRequestId]
        } else {
            return null
        }
    })

    console.log('deleteRequest')
    console.log(deleteRequest)

    // ============ Actions and Event Handling ======================
    //
    const dispatch = useDispatch()
    
    const onChange = function(event) {
        console.log('=== onChange ====')
        if ( ! fileData && ! file ) {
            console.log('No file.')
            if ( uploadRequestId && uploadRequest) {
                console.log('Reset upload request.')
                dispatch(cleanupRequest(uploadRequest))
            } else if ( (uploadRequestId && ! uploadRequest)) {
                // We shouldn't be able to end up in this position, because we
                // should always show a spinner while the uploadRequest is
                // processing, so the user shouldn't be able to hit the input
                // button until we've processed the last uploadRequest.
                throw new Error('We are in an invalid state.')
            } 

            setFileData(event.target.files[0])
            setUploadRequestId(dispatch(uploadFile(event.target.files[0])))
        } else {
            // We shouldn't be able to get here, because we should always show
            // a spinner when we have fileData but no file.  Which means the
            // user shouldn't be able to change the file input.
            throw new Error('We are in an invalid state.')
        }
        console.log('=== END onChange ===')
    }

    const removeFile = function(event) {
        console.log('=== removeFile ===')
        if ( uploadRequestId && uploadRequest )  {
            console.log('Cleanup upload request.')
            setUploadRequestId(null)
            dispatch(cleanupRequest(uploadRequest))
        } 

        setDeleteRequestId(dispatch(deleteFile(file.id)))
        console.log('=== END removeFile ===')
    }

    // ============ Effect Handling ==================================
    
    useLayoutEffect(function() {
        console.log('=== FileUploadInput.LayoutEffect ===')
        if ( deleteRequest && deleteRequest.state == 'fulfilled') {
            console.log('Delete request finished, cleanup.')
            setFileData(null)
            setFile(null)
        }
        console.log('=== END FileUploadInput.LayoutEffect ===')
    }, [ deleteRequest ])


    useEffect(function() {
        console.log('=== FileUploadInput.useEffect ===')
        if ( uploadRequest && uploadRequest.state == 'fulfilled') {
            console.log('Upload request finished.')
            const file = uploadRequest.result
            setFile(file)
            props.setFile(file)
        }
        console.log('=== END FileUploadInput.useEffect ===')
    }, [ uploadRequest ])

    // Clean up our upload request.
    useEffect(function() {
        return function cleanup() {
            if ( uploadRequestId) {
                dispatch(cleanupRequest({ requestId: uploadRequestId}))
            }
        }
    }, [ uploadRequestId])

    // Clean up our delete request.
    useEffect(function() {
        return function cleanup() {
            if ( deleteRequestId ) {
                dispatch(cleanupRequest({ requestId: deleteRequestId}))
            }
        }
    }, [ deleteRequestId ])



    // ============ Render ==========================================

    let content = null

    console.log('Delete Request')
    console.log(deleteRequestId)
    console.log(deleteRequest)

    console.log('Upload Request')
    console.log(uploadRequestId)
    console.log(uploadRequest)
    // Spinner while we wait for requests to process so that we can't start a new request on top of an existing one.
    if ( (deleteRequestId && ! deleteRequest) || (deleteRequest && deleteRequest.state == 'pending') 
        || ( uploadRequestId && ! uploadRequest) || (uploadRequest && uploadRequest.state == 'pending') ) 
    {
        content = ( <Spinner /> )

    // Request failure - report an error.
    } else if (  deleteRequest && deleteRequest.state == 'failed') {
        content = (<div className="error"> { deleteRequest.error }</div>)
    } else if ( uploadRequest && uploadRequest.state == 'failed' ) {
        content = (<div className="error"> { uploadRequest.error }</div>)
    } else { 
        // We're not waiting for any thing, render the content.
        if ( fileData && file ) {
            content = (
                <div className="file">
                    <div className="document-icon"><DocumentTextIcon /></div>
                    <div className="file-details">
                        <div className="filename"><span className="label">File Name:</span> {fileData.name}</div>
                        <div className="filetype"><span className="label">Type: </span> {file.type}</div>
                    </div>
                    <div className="close-icon"><XCircleIcon onClick={removeFile} /></div>
                </div>
            )
        } else if (( fileData && ! file) ) {
            content = ( <Spinner /> )
        } else {
            content = (
                <div className="upload-input">
                    <label htmlFor="upload">Select a file to upload</label>
                    <input type="file"
                        name="file"
                        onChange={onChange} 
                    />
                </div>
            )
        }
    }

    // Perform the render.
    return (
        <div className="file-upload field-wrapper">
            { content }
            { props.error && <div className="error">{ props.error }</div> }
        </div>
    )

}

export default FileUploadInput 
