import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

import { useDispatch, useSelector } from 'react-redux'

import { patchReview, cleanupRequest } from '/state/reviews'

import { CheckCircleIcon, AnnotationIcon, XCircleIcon } from '@heroicons/react/outline'
import  { CheckIcon, XIcon } from '@heroicons/react/solid'

import UserTag from '/components/users/UserTag'
import DateTag from '/components/DateTag'
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
    const isOwner = (currentUser && isAuthor && props.paper.authors.find((a) => a.user.id == currentUser.id).owner ? true : false)
    const reviewerIsAuthor = (props.paper.authors.find((a) => a.user.id == props.selectedReview.userId) ? true : false)

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
        if ( isAuthor && isOwner && ! reviewerIsAuthor 
            && props.selectedReview.status == 'submitted' && props.selectedReview.recommendation !== 'commentary' ) 
        {
            authorControls = (
                <div className="author-controls">
                    <button onClick={acceptReview}>Accept Review</button>
                    <button onClick={rejectReview}>Reject Review</button>
                </div>
            )
        } else if ( props.selectedReview.status !== 'submitted' ) {
            let status = null
            if ( props.selectedReview.status == 'accepted' ) {
                status = ( <div className="accepted"> <CheckIcon /> Accepted</div> )
            } else if ( props.selectedReview.status == 'rejected' ) {
                status = ( <div className="rejected"> <XIcon /> Rejected </div> )
            }
            authorControls = (
                <div className="author-controls">
                    { status }
                </div>
            )
        }

        let recommendation = null
        if ( props.selectedReview.status !== 'in-progress' ) {
            let message = null
            if ( props.selectedReview.recommendation == 'commentary' ) {
                message = (<div className="commentary">Commentary (No recommendation)</div>)
            } else if ( props.selectedReview.recommendation == 'approve' ) {
                message = (<div className="approved"> <CheckCircleIcon /> Recommends Approval</div>)
            } else if ( props.selectedReview.recommendation == 'request-changes' ) {
                message = (<div className="request-changes"><AnnotationIcon /> Recommends Changes</div>)
            } else if ( props.selectedReview.recommendation == 'reject' ) {
                message = (<div className="rejected"><XCircleIcon /> Recommends Rejection</div>)
            }

            recommendation = (
                <div className="recommendation">
                    {message}
                </div>
            )
        }

        return (
            <div className="review-summary">
                <div className="summary">
                    <div className="reviewer">Reviewed by <UserTag id={props.selectedReview.userId} /></div>
                    <div className="datetime"><DateTag timestamp={props.selectedReview.createdDate} /></div>
                    { recommendation }
                    <div className="summary-text"><ReactMarkdown>{props.selectedReview.summary}</ReactMarkdown></div>
                </div>
                {authorControls}
            </div>
        )
    } else {
        return null
    }

}

export default ReviewSummaryView 
