import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { DocumentTextIcon } from '@heroicons/react/outline'

import { uploadFile, cleanupRequest } from '/state/files'

import Spinner from '/components/Spinner'

import './FileUploadInput.css'

const FileUploadInput = function(props) {
    const [requestId, setRequestId] = useState(null)
    const [file, setFile] = useState(null)
    const [fileData, setFileData] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        if ( requestId) {
            return state.files.requests[requestId]
        } else {
            return null
        }
    })

    const onChange = function(event) {
        if ( ! fileData && ! file ) {

            setFileData(event.target.files[0])

            if ( requestId && request  && request.id == requestId) {
                dispatch(cleanupRequest(request))
            } else if ( (requestId && ! request) || (requestId && request && request.id !== requestId)) {
                throw new Error('We somehow have a requestId that does not match the request when calling onChange.  This should not happen!')
            } 

            setRequestId(dispatch(uploadFile(event.target.files[0])))
        }
    }

    useEffect(function() {
        if ( request && request.state == 'fulfilled') {
            const file = request.result
            setFile(file)
            props.setFile(file)
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }
    }, [ request ])


    if (  ( requestId && ! request) || (request && request.state !== 'fulfilled') ) {
        return (<div className="file-upload field-wrapper"> <Spinner /> </div> )
    } else { 
        let content = null
        if ( fileData && file ) {
            content = (
                <div className="file">
                    <DocumentTextIcon />
                    <div className="filename"><span className="label">File Name:</span> {fileData.name}</div>
                    <div className="filetype"><span className="label">Type: </span> {file.type}</div>
                </div>
            )
        } else if (( fileData && ! file) ) {
            content = ( <Spinner /> )
        }

        return (
            <div className="file-upload field-wrapper">
                { content }
                <div className="upload-input">
                    <label htmlFor="upload">Select a file to upload</label>
                    <input type="file"
                        name="file"
                        onChange={onChange} 
                    />
                </div>
            </div>
        )
    }

}

export default FileUploadInput 
