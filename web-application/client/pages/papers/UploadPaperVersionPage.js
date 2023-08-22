import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'

import { getPaper, cleanupRequest } from '/state/papers'

import UploadPaperVersionForm from '/components/papers/draft/version/UploadPaperVersionForm'
import Spinner from '/components/Spinner'

import './UploadPaperVersionPage.css'

const UploadPaperVersionPage = function(props) {

    const { id } = useParams()
    
    // ======= Request Tracking =====================================
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.papers.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[id]
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()
    const navigate = useNavigate()

    // Make sure we have our paper.
    useEffect(function() {
        setRequestId(dispatch(getPaper(id)))
    }, [])

    // Confirm that we're allowed to be here.  Leave if not.
    useEffect(function() {
        if ( ! currentUser ) {
            navigate("/")
        }

        if ( request && request.state == 'fulfilled') {
            if ( ! paper ) {
                navigate("/")
            }

            if ( ! paper.authors.find((a) => a.userId == currentUser.id)) {
                navigate("/")
            }
        }
    }, [request])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    if ( ! currentUser || ! paper ) {
        return ( <Spinner /> )
    } else {

        return (
            <div id="upload-paper-version" className="page">
                <UploadPaperVersionForm paper={paper} />
            </div>
        )
    }

}

export default UploadPaperVersionPage
