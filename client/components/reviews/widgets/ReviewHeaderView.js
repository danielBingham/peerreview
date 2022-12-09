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
 * @param {Object} props.paper  Populated paper object. The draft we're viewing.
 * @param {integer} props.versionNumber The version of the paper we're currently viewing.
 */
const ReviewHeaderView = function(props) {
    console.log(`\n\n ### ReviewHeaderView ###`)
    console.log(`PaperId: ${props.paper.id}, versionNumber: ${props.versionNumber}.`)

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

    const reviewInProgress = useSelector(function(state) {
        if ( state.reviews.inProgress[props.paper.id] ) {
            return state.reviews.inProgress[props.paper.id][props.versionNumber]
        } else {
            return null
        }
    })

    // ================= User Action Handling  ================================
    
    const dispatch = useDispatch()

    const startReview = function(event) {
        console.log(`ReviewHeaderView::startReview.`)
        if ( ! reviewInProgress ) {
            setPostReviewRequestId(dispatch(newReview(props.paper.id, props.versionNumber, currentUser.id)))
        }
    }

    // ======= Effect Handling ======================================
    
    // Request tracker cleanup.
    useEffect(function() {
        console.log(`ReviewHeaderView::useEffect - cleanup postReviewsRequest`)
        return function cleanup() {
            if ( postReviewsRequestId ) {
                dispatch(cleanupReviewRequest({ requestId: postReviewsRequestId }))
            }
        }
    }, [ postReviewsRequestId ])

    // ======= Render ===============================================

    console.log(`ReviewHeaderView::render()`)
    let content = null 
    if ( reviewInProgress ) {
        content = ( 
            <>
                <div className="instructions">Currently reviewing version { props.versionNumber }.  Click anywhere on the document to add a comment.  Write review summary and make a recommentation below.  New comment threads will not be public until the review is submitted.  Comments added to existing threads are immediately public.</div>
                <ReviewSummaryForm paper={props.paper} versionNumber={props.versionNumber} selectedReview={reviewInProgress} /> 
            </>
        )
    } else {
        content = (
            <p style={{ textAlign: 'center' }}>Viewing full text of version { props.versionNumber } with comments from all reviews.  <button onClick={startReview}>Start Review</button> to begin a new review and add comments.</p>
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
