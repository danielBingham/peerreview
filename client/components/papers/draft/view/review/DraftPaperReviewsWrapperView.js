import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { getReviews, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

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
 */
const DraftPaperReviewsWrapperView = function(props) {
    const [ reviewsRequestId, setReviewsRequestId ] = useState(null)

    const dispatch = useDispatch()

    const reviewsRequest = useSelector(function(state) {
        if ( ! reviewsRequestId ) {
            return null
        } else {
            return state.reviews.requests[reviewsRequestId]
        }
    })

    /**
     * Once we've retrieved the papers, retrieve the reviews.
     */
    useEffect(function() {
        if ( ! reviewsRequestId ) {
            setReviewsRequestId(dispatch(getReviews(props.paper.id)))
        }

        return function cleanup() {
            if ( reviewsRequest) {
                dispatch(cleanupReviewRequest(reviewsRequest))
            }
        }

    }, [])

    if ( reviewsRequest && reviewsRequest.state == 'fulfilled') {
        const id = `paper-${props.paper.id}-reviews`
        return (
            <div id={id} className="draft-paper-reviews-wrapper">
                <ReviewHeaderView paper={props.paper} />
                <ReviewListView paper={props.paper} />
                <DraftPaperPDFView paper={props.paper} />
            </div>
        )
    } else {
        return (
            <Spinner />
        )
    }
}

export default DraftPaperReviewsWrapperView

