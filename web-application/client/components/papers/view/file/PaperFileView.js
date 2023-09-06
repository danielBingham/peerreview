import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { getReviews, clearList, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import ReviewHeaderView from '/components/reviews/widgets/ReviewHeaderView'
import PaperPDFView from './pdf/PaperPDFView'

import Spinner from '/components/Spinner'

import './PaperFileView.css'

/**
 * Show a draft paper and its reviews, or show the reviews from the draft stage
 * of a published paper.
 *
 * Assumptions:
 *  - Assumes we have a current user logged in.  
 * 
 * @param {Object} props    Standard react props object.
 * @param {int} props.id    The id of the draft paper we want to load and show
 * reviews for. 
 */
const PaperFileView = function({ id }) {

    const [ searchParams, setSearchParams ] = useSearchParams()
    
    // ================= Request Tracking =====================================

    const [ reviewsRequestId, setReviewsRequestId ] = useState(null)
    const reviewsRequest = useSelector(function(state) {
        if ( ! reviewsRequestId ) {
            return null
        } else {
            return state.reviews.requests[reviewsRequestId]
        }
    })

    // ================= Redux State ==========================================

    const reviewQuery = useSelector(function(state) {
        return state.reviews.queries[id]
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[id]
    })

    const versionNumber = ( searchParams.get('version') ? searchParams.get('version') : paper.versions[0].version )

    // ======= Effect Handling =====================
   
    const dispatch = useDispatch()
    
    /**
     * Retrieve the reviews on mount.  Cleanup the request on dismount.
     */
    useEffect(function() {
        if ( ! reviewsRequestId ) {
            setReviewsRequestId(dispatch(getReviews(id, id)))
        } else if (reviewsRequest?.state == 'fulfilled' && ! reviewQuery ) {
            setReviewsRequestId(dispatch(getReviews(id, id)))
        }
    }, [ reviewQuery ])

    useEffect(function() {
        return function cleanup() {
            if ( reviewsRequestId) {
                dispatch(cleanupReviewRequest({ requestId: reviewsRequestId }))
            }
        }
    }, [ reviewsRequestId ])

    // ================= Render ===============================================

    if ( reviewsRequest && reviewsRequest.state == 'fulfilled') {
        return (
            <div id={`paper-${id}`} className="paper-file-view">
                <ReviewHeaderView paperId={id} versionNumber={versionNumber} />
                <PaperPDFView paperId={id} versionNumber={versionNumber} />
            </div>
        )
    } else {
        return (
            <div id={`paper-${id}`} className="paper-file-view">
                <Spinner local={true}/>
            </div>
        )
    }

}

export default PaperFileView 
