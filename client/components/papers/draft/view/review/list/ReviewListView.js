import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useSearchParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { setInProgress, clearSelected, newReview, cleanupRequest } from '/state/reviews'

import Spinner from '/components/Spinner'

import ReviewListItemView from './ReviewListItemView'
import './ReviewListView.css'

/**
 * Display a list of reviews for this paper, with the selected review on top.
 *
 * ASSUMPTIONS:
 * - We have a current user logged in.  Leaves it to the Page object to handle that.
 * - We've already refreshed the reviews in state.
 *
 * @param {object} paper - The populated paper object who's reviews we're
 * displaying.
 */
const ReviewListView = function(props) {

    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Request Tracking =====================================

    const [ postReviewsRequestId, setPostReviewRequestId ] = useState(null)

    const postReviewsRequest = useSelector(function(state) {
        if ( ! postReviewsRequestId ) {
            return null
        } else {
            return state.reviews.requests[postReviewsRequestId]
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const reviews = useSelector(function(state) {
        if ( state.reviews.list[props.paper.id] ) {
            return state.reviews.list[props.paper.id].filter((r) => r.version == props.versionNumber)
        } else {
            return null 
        }
    })

    const reviewInProgress = useSelector(function(state) {
        return state.reviews.inProgress[props.paper.id]
    })

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch()

    const startReview = function(event) {
        if ( ! reviewInProgress ) {
            setPostReviewRequestId(dispatch(newReview(props.paper.id, props.versionNumber, currentUser.id)))
        }
    }

    const showAll = function(event) {
        searchParams.delete('review')
        setSearchParams(searchParams)
    }

    // ======= Effect Handling ======================================

    // Request tracker cleanup.
    useEffect(function() {
        return function cleanup() {
            if ( postReviewsRequestId ) {
                dispatch(cleanupRequest({ requestId: postReviewsRequestId }))
            }
        }
    }, [ postReviewsRequestId ])

    // ======= Render ===============================================

    const reviewItems = []
    if ( reviews ) {
        for(const review of reviews) {
            reviewItems.push(<ReviewListItemView key={review.id} review={review} selected={ props.selectedReview && props.selectedReview.id == review.id } />)
        }
    }

    return (
        <div className="review-list">
            <div className="header review-list-item">
                Reviews
            </div>
            <div className="review-controls review-list-item">
                <button onClick={showAll}>Show All</button>
                { ! reviewInProgress && <button onClick={startReview}>Start Review</button> }
            </div>
            { reviewItems }
        </div>
    )

}

export default ReviewListView 
