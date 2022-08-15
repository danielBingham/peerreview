import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { useSearchParams } from 'react-router-dom'

import {  patchPaper, patchPaperVersion, cleanupRequest as cleanupPaperRequest } from '/state/papers'
import {  newReview, patchReview, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import './DraftPaperControlView.css'

/**
 * Renders the control panel for the review screen.
 *
 * @param {Object} props    Standard react props object.
 * @param {Object} props.paper  The draft paper we're rendering controls for.
 * @param {integer} props.versionNumber The version of the paper we currently have selected.
 */
const DraftPaperControlView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ================= Request Tracking =====================================
    
    const [ patchPaperRequestId, setPatchPaperRequestId ] = useState(null)
    const patchPaperRequest = useSelector(function(state) {
        if ( ! patchPaperRequestId ) {
            return null
        } else {
            return state.papers.requests[patchPaperRequestId]
        }
    })

    const [ patchPaperVersionRequestId, setPatchPaperVersionRequestId] = useState(null)
    const patchPaperVersionRequest = useSelector(function(state) {
        if ( patchPaperVersionRequestId ) {
            return state.papers.requests[patchPaperVersionRequestId]
        } else {
            return null
        }
    })

    const [ postReviewsRequestId, setPostReviewRequestId ] = useState(null)
    const postReviewsRequest = useSelector(function(state) {
        if ( ! postReviewsRequestId ) {
            return null
        } else {
            return state.reviews.requests[postReviewsRequestId]
        }
    })
   
    // ================= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const reviewInProgress = useSelector(function(state) {
        if ( ! state.reviews.inProgress[props.paper.id] ) {
            return null
        } else if ( ! state.reviews.inProgress[props.paper.id][props.versionNumber] ) {
            return null
        }
        return state.reviews.inProgress[props.paper.id][props.versionNumber]
    })

    const isAuthor = (currentUser && props.paper.authors.find((a) => a.user.id == currentUser.id) ? true : false)
    const isOwner = (currentUser && isAuthor && props.paper.authors.find((a) => a.user.id == currentUser.id).owner ? true : false)

    // ================= User Action Handling  ================================

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const publishPaper = function(event) {
        event.preventDefault()

        const paperPatch = {
            id: props.paper.id,
            isDraft: false
        }
        setPatchPaperRequestId(dispatch(patchPaper(paperPatch)))

        const latestVersion = props.paper.versions[0]
        const paperVersionPatch = {
            paperId: latestVersion.paperId,
            version: latestVersion.version,
            isPublished: true
        }
        setPatchPaperVersionRequestId(dispatch(patchPaperVersion(props.paper, paperVersionPatch)))
    }

    const uploadVersion = function(event) {
        const uri = `/draft/${props.paper.id}/versions/upload`
        navigate(uri)
    }

    const changeVersion = function(event) {
        const versionNumber = event.target.value
        const uri = `/draft/${props.paper.id}/version/${versionNumber}`
        navigate(uri)
    }

    const startReview = function(event) {
        if ( ! reviewInProgress ) {
            setPostReviewRequestId(dispatch(newReview(props.paper.id, props.versionNumber, currentUser.id)))
        }
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if (patchPaperRequest && patchPaperRequest.state == 'fulfilled'  
            && patchPaperVersionRequest && patchPaperVersionRequest.state == 'fulfilled') 
        {
            const paperPath = '/paper/' + paper.id
            navigate(paperPath)
        }
    }, [ patchPaperRequest, patchPaperVersionRequest ])

    useEffect(function() {
        if ( postReviewsRequest && postReviewsRequest.state == 'fulfilled') {
            searchParams.set('review', postReviewsRequest.result.id)
            setSearchParams(searchParams)
        }
    }, [ postReviewsRequest ])

    // Request cleanup. 
    useEffect(function() {
        return function cleanup() {
            if ( patchPaperRequestId ) {
                dispatch(cleanupPaperRequest({ requestId: patchPaperRequestId }))
            }
        }
    }, [ patchPaperRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( patchPaperVersionRequestId ) {
                dispatch(cleanupPaperRequest({ requestId: patchPaperVersionRequestId }))
            }
        }
    }, [ patchPaperVersionRequestId ])


    // Request tracker cleanup.
    useEffect(function() {
        return function cleanup() {
            if ( postReviewsRequestId ) {
                dispatch(cleanupReviewRequest({ requestId: postReviewsRequestId }))
            }
        }
    }, [ postReviewsRequestId ])

    // ======= Render ===============================================
    
    let contents = ''
     if ( isAuthor && isOwner ) {
         contents = (
             <div className="author-controls">
                 <button onClick={uploadVersion}>Upload New Version</button>
                 <button onClick={publishPaper}>Publish</button>
             </div>
        )
     }

    const paperVersionOptions = []
    for( const paperVersion of props.paper.versions ) {
        paperVersionOptions.push(<option key={paperVersion.version} value={paperVersion.version}>{ paperVersion.version }</option>)     
    }


    return (
        <div className="draft-paper-controls">
            { contents }
            <div className="version-controls">
                <label htmlFor="versionNumber">Show Version</label>
                <select name="versionNumber" value={props.versionNumber} onChange={changeVersion}>
                    {paperVersionOptions}
                </select>
                { ! reviewInProgress && <button onClick={startReview}>Start Review</button> }
            </div>
        </div>
    )

}

export default DraftPaperControlView
