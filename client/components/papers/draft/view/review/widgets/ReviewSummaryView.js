import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

import { useDispatch, useSelector } from 'react-redux'

import { patchReview, cleanupRequest } from '/state/reviews'

import Spinner from '/components/Spinner'

import './ReviewSummaryView.css'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 */
const ReviewSummaryView = function(props) {

    
    // ======= Request Tracking =====================================
    
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.reviews.requests[requestId]
        } else {
            return null
        }
    })
    
    // ======= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const isAuthor = (currentUser && props.paper.authors.find((a) => a.user.id == currentUser.id) ? true : false)

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch() 

    /**
     * Accept the selected review.
     *
     * @param {Event} event Standard javascript onClick event.
     */
    const acceptReview = function(event) {
        event.preventDefault()
        
        const reviewPatch = {
            id: props.selectedReview.id,
            paperId: props.paper.id,
            status: 'accepted'
        }
        setRequestId(dispatch(patchReview(reviewPatch)))
    }

    /**
     * Reject the selected review.
     *
     * @param {Event} event Standard javascript onClick event.
     */
    const rejectReview = function(event) {
        event.preventDefault()

        const reviewPatch = {
            id: props.selectedReview.id,
            paperId: props.paper.id,
            status: 'rejected'
        }
        setRequestId(dispatch(patchReview(reviewPatch)))
    }

    // ======= Effect Handling ======================================

    // Clean up the patchReviews request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================
    
    if ( props.selectedReview && props.selectedReview.status == 'in-progress' ) {
        return null
    } else if ( props.selectedReview ) {
        let authorControls = null
        if ( isAuthor && props.selectedReview.status == 'submitted' ) {
            authorControls = (
                <div className="author-controls">
                    <button onClick={acceptReview}>Accept Review</button>
                    <button>Reject Review</button>
                </div>
            )
        } else {
            authorControls = (
                <div className="author-controls">
                    { props.selectedReview.status }
                </div>
            )
        }

        return (
            <>
                <div id={`selected-review-${props.selectedReview.id}`} className="review-summary">
                    <div className="datetime">{props.selectedReview.createdDate}</div>
                    <div className="recommendation">{props.selectedReview.recommendation}</div>
                    <div className="summary"><ReactMarkdown>{props.selectedReview.summary}</ReactMarkdown></div>
                </div>
                {authorControls}
            </>
        )
    } else {
        return null
    }

}

export default ReviewSummaryView 
