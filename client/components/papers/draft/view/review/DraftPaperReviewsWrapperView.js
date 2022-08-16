import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { getReviews, clearList, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import Spinner from '/components/Spinner'

import ReviewHeaderView from './widgets/ReviewHeaderView'
import ReviewListView from './list/ReviewListView'

import DraftPaperPDFView from '../pdf/DraftPaperPDFView'

import './DraftPaperReviewsWrapperView.css'

/**
 * Display paper and its reviews.  Queries the backend for the freshest
 * version of the reviews before loading them.
 *
 * @param {Object} paper - A populated paper object representing the paper
 * we're intending to display.
 * @param {integer} versionNumber   The version of the paper we currently have
 * selected.
 */
const DraftPaperReviewsWrapperView = function(props) {

    // ======= Request Tracking =====================================

    const [ reviewsRequestId, setReviewsRequestId ] = useState(null)
    const reviewsRequest = useSelector(function(state) {
        if ( ! reviewsRequestId ) {
            return null
        } else {
            return state.reviews.requests[reviewsRequestId]
        }
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()
    /**
     * Retrieve the reviews on mount.  Cleanup the request on dismount.
     */
    useEffect(function() {
        if ( ! reviewsRequestId ) {
            dispatch(clearList(props.paper.id))
            setReviewsRequestId(dispatch(getReviews(props.paper.id)))
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
        const id = `paper-${props.paper.id}-reviews`
        return (
            <div id={id} className="draft-paper-reviews-wrapper">
                <ReviewListView paper={props.paper} versionNumber={props.versionNumber}  />
                <div className="toolbar">
                </div>
                <div className="scroll-pane">
                    <ReviewHeaderView paper={props.paper} versionNumber={props.versionNumber} />
                    <DraftPaperPDFView paper={props.paper} versionNumber={props.versionNumber} />
                </div>
            </div>
        )
    } else {
        return (
            <Spinner />
        )
    }
}

export default DraftPaperReviewsWrapperView

