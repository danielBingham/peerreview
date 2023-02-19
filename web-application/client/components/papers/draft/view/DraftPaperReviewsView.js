import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { getReviews, clearList, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import Spinner from '/components/Spinner'

import DraftPaperHeader from './header/DraftPaperHeader'
import ReviewList from '/components/reviews/list/ReviewList'


import './DraftPaperReviewsView.css'

/**
 * Display paper and its reviews.  Queries the backend for the freshest
 * version of the reviews before loading them.
 *
 * @param {Object} paper - A populated paper object representing the paper
 * we're intending to display.
 * @param {integer} versionNumber   The version of the paper we currently have
 * selected.
 */
const DraftPaperReviewsView = function(props) {
    // ======= Request Tracking =====================================

    const [ reviewsRequestId, setReviewsRequestId ] = useState(null)
    const reviewsRequest = useSelector(function(state) {
        if ( ! reviewsRequestId ) {
            return null
        } else {
            return state.reviews.requests[reviewsRequestId]
        }
    })

    // ================= Redux State ==========================================

    const paper = useSelector(function(state) {
        return state.papers.dictionary[props.paperId]
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()
    /**
     * Retrieve the reviews on mount.  Cleanup the request on dismount.
     */
    useEffect(function() {
        if ( ! reviewsRequestId ) {
            dispatch(clearList(props.paperId))
            setReviewsRequestId(dispatch(getReviews(props.paperId)))
        }
    }, [])

    useEffect(function() {
        return function cleanup() {
            if ( reviewsRequestId) {
                dispatch(cleanupReviewRequest({ requestId: reviewsRequestId }))
            }
        }
    }, [ reviewsRequestId ])

    // ======= Render ===============================================

    if ( reviewsRequest && reviewsRequest.state == 'fulfilled') {
        return (
            <div id={`paper-${props.paperId}-reviews`} className="draft-paper-reviews">
                <DraftPaperHeader id={props.paperId} tab={props.tab} versionNumber={props.versionNumber} />
                <ReviewList paperId={props.paperId} versionNumber={props.versionNumber} />
            </div>
        )
    } else {
        return (
            <Spinner />
        )
    }
}

export default DraftPaperReviewsView

