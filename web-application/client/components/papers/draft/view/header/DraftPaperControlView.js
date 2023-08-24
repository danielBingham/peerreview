import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams, useNavigate } from 'react-router-dom'

import {  patchPaper, cleanupRequest as cleanupPaperRequest } from '/state/papers'
import {  newReview, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import Button from '/components/generic/button/Button'

import './DraftPaperControlView.css'

/**
 * Renders the control panel for the review screen.
 *
 * Assumptions:
 *  - paper already exists in the store
 *
 * @param {Object} props    Standard react props object.
 * @param {Object} props.id The id of the draft paper we're rendering controls for.
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

    const paper = useSelector(function(state) {
        return state.papers.dictionary[props.id]
    })

    const reviewInProgress = useSelector(function(state) {
        if ( ! state.reviews.inProgress[paper.id] ) {
            return null
        } else if ( ! state.reviews.inProgress[paper.id][props.versionNumber] ) {
            return null
        }
        return state.reviews.inProgress[paper.id][props.versionNumber]
    })

    const isAuthor = (currentUser && paper.authors.find((a) => a.userId == currentUser.id) ? true : false)
    const isOwner = (currentUser && isAuthor && paper.authors.find((a) => a.userId == currentUser.id).owner ? true : false)

    // ================= User Action Handling  ================================

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const publishPaper = function(event) {
        event.preventDefault()
        const uri = `/draft/${paper.id}/publish`
        navigate(uri)
    }

    const uploadVersion = function(event) {
        const uri = `/draft/${paper.id}/versions/upload`
        navigate(uri)
    }

    const changeVersion = function(event) {
        const versionNumber = event.target.value
        let urlString = ''
        if ( paper.isDraft ) {
            urlString = `/draft/${props.id}/version/${versionNumber}/${props.tab}`
        } else {
            urlString = `/paper/${props.id}/version/${versionNumber}/${props.tab}` 
        }
        navigate(urlString)
    }

    const startReview = function(event) {
        if ( ! reviewInProgress ) {
            setPostReviewRequestId(dispatch(newReview(paper.id, props.versionNumber, currentUser.id)))

            let urlString = `/draft/${props.id}/version/${props.versionNumber}/drafts`
            navigate(urlString)
        }
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if (patchPaperRequest && patchPaperRequest.state == 'fulfilled' )
        {
            const paperPath = '/paper/' + paper.id
            navigate(paperPath)
        }
    }, [ patchPaperRequest ])

    // Request cleanup. 
    useEffect(function() {
        return function cleanup() {
            if ( patchPaperRequestId ) {
                dispatch(cleanupPaperRequest({ requestId: patchPaperRequestId }))
            }
        }
    }, [ patchPaperRequestId ])

    // Request tracker cleanup.
    useEffect(function() {
        return function cleanup() {
            if ( postReviewsRequestId ) {
                dispatch(cleanupReviewRequest({ requestId: postReviewsRequestId }))
            }
        }
    }, [ postReviewsRequestId ])

    // ======= Render ===============================================
   
    const viewOnly = ! paper.isDraft
    
    let contents = ''
     if ( ! viewOnly && isAuthor && isOwner ) {
         contents = (
             <div className="author-controls">
                 <button onClick={uploadVersion}>Upload New Version</button>
             </div>
        )
     }

    const paperVersionOptions = []
    for( const paperVersion of paper.versions ) {
        paperVersionOptions.push(<option key={paperVersion.version} value={paperVersion.version}>{ paperVersion.version }</option>)     
    }


    return (
        <div className="draft-paper-controls">
            <div className="version-controls">
                <label htmlFor="versionNumber">Show Version</label>
                <select name="versionNumber" value={props.versionNumber} onChange={changeVersion}>
                    {paperVersionOptions}
                </select>
                { ! reviewInProgress && ! viewOnly && currentUser && <Button onClick={startReview}>Start Review</Button> }
            </div>
            { contents }
        </div>
    )

}

export default DraftPaperControlView
