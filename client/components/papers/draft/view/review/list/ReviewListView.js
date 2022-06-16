import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { setInProgress, clearSelected, postReviews, cleanupRequest } from '/state/reviews'

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
    const [ postReviewsRequestId, setPostReviewRequestId ] = useState(null)

    const dispatch = useDispatch()

    const postReviewsRequest = useSelector(function(state) {
        if ( ! postReviewsRequestId ) {
            return null
        } else {
            return state.reviews.requests[postReviewsRequestId]
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const selected = useSelector(function(state) {
        return state.reviews.selected[props.paper.id]
    })

    const reviews = useSelector(function(state) {
        return state.reviews.list[props.paper.id]
    })

    const reviewInProgress = useSelector(function(state) {
        return state.reviews.inProgress[props.paper.id]
    })


    const startReview = function(event) {
        const newReview = {
            paperId: props.paper.id,
            userId: currentUser.id,
            summary: '',
            status: 'in-progress',
            recommendation: 'request-changes',
            comments: []
        }
        setPostReviewRequestId(dispatch(postReviews(newReview)))
    }

    const showAll = function(event) {
        dispatch(clearSelected(props.paper.id))
    }

    useEffect(function() {

        return function cleanup() {
            if ( postReviewsRequest ) {
                dispatch(cleanupRequest(postReviewsRequest))
            }
        }

    }, [postReviewsRequest])

    const reviewItems = []
    if ( reviews ) {
        for(const review of reviews) {
            reviewItems.push(<ReviewListItemView key={review.id} review={review} selected={ selected && selected.id == review.id } />)
        }
    }

    return (
        <div className="review-list">
            <div className="review-controls">
                { ! reviewInProgress && <button onClick={startReview}>Start Review</button> }
            </div>
            <div id="show-all-reviews" 
                onClick={showAll} 
                className={ ! selected ? "review-list-item selected" : "review-list-item" }
            >
                Show All
            </div>
            { reviewItems }
        </div>
    )

}

export default ReviewListView 
