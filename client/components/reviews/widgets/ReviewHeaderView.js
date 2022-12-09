import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import {  newReview, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import Spinner from '/components/Spinner'

import ReviewSummaryView from './ReviewSummaryView'
import ReviewSummaryForm from './ReviewSummaryForm'

import './ReviewHeaderView.css'

/**
 * Render the Header for the Draft View page.  Currently used on `/draft/:id`
 *
 * @param {Object} props    Standard React props object.
 * @param {Object} props.paperId  The id of the paper this review belongs to.
 * @param {integer} props.versionNumber The version of the paper we're currently viewing.
 */
const ReviewHeaderView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ================= Request Tracking =====================================
    
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
        return state.papers.dictionary[props.paperId]
    })

    const reviewInProgress = useSelector(function(state) {
        if ( state.reviews.inProgress[props.paperId] ) {
            return state.reviews.inProgress[props.paperId][props.versionNumber]
        } else {
            return null
        }
    })

    // ================= User Action Handling  ================================
    
    const dispatch = useDispatch()

    const startReview = function(event) {
        if ( ! reviewInProgress ) {
            setPostReviewRequestId(dispatch(newReview(props.paperId, props.versionNumber, currentUser.id)))
        }
    }

    // ======= Effect Handling ======================================
    
    // Request tracker cleanup.
    useEffect(function() {
        return function cleanup() {
            if ( postReviewsRequestId ) {
                dispatch(cleanupReviewRequest({ requestId: postReviewsRequestId }))
            }
        }
    }, [ postReviewsRequestId ])

    // ======= Render ===============================================
    let content = null 
    if ( paper.isDraft ) {
        if ( reviewInProgress ) {
            content = ( 
                <>
                    <div className="instructions">Currently reviewing version { props.versionNumber }.  Click anywhere on the document to add a comment.  Write review summary and make a recommentation below.  New comment threads will not be public until the review is submitted.  Comments added to existing threads are immediately public.</div>
                    <ReviewSummaryForm paper={paper} versionNumber={props.versionNumber} selectedReview={reviewInProgress} /> 
                </>
            )
        } else {
            content = (
                <p style={{ textAlign: 'center' }}>Viewing full text of version { props.versionNumber } with comments from all reviews.  <button onClick={startReview}>Start Review</button> to begin a new review and add comments.</p>
            )
        }
    } else {
        content = (
            <p style={{ textAlign: 'center' }}>Viewing full text of version { props.versionNumber } with comments from all reviews.</p>
        )
    }
    return (
        <div className="review-header">
            <div className="inner">
                { content }
            </div>
        </div>
    )
}

export default ReviewHeaderView
