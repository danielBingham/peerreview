import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getReviews, clearList, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import DraftPaperHeader from './header/DraftPaperHeader'
import ReviewHeaderView from '/components/reviews/widgets/ReviewHeaderView'
import DraftPaperPDFView from './pdf/DraftPaperPDFView'

import Spinner from '/components/Spinner'

import './DraftPaperView.css'

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
const DraftPaperView = function({ id, versionNumber, tab }) {
    
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

    // ======= Effect Handling =====================
   
    const dispatch = useDispatch()
    
    /**
     * Retrieve the reviews on mount.  Cleanup the request on dismount.
     */
    useEffect(function() {
        if ( ! reviewsRequestId ) {
            dispatch(clearList(id))
            setReviewsRequestId(dispatch(getReviews(id)))
        }
    }, [])

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
            <div id={`paper-${id}`} className="draft-paper">
                <DraftPaperHeader id={id} tab={tab} versionNumber={versionNumber} />
                <ReviewHeaderView paperId={id} versionNumber={versionNumber} />
                <DraftPaperPDFView paperId={id} versionNumber={versionNumber} />
            </div>
        )
    } else {
        return (
            <div id={`paper-${id}`} className="draft-paper">
                <Spinner local={true}/>
            </div>
        )
    }

}

export default DraftPaperView 
