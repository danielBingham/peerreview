import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

import { useDispatch, useSelector } from 'react-redux'

import { patchReview, cleanupRequest } from '/state/reviews'

import { CheckCircleIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, XCircleIcon } from '@heroicons/react/24/outline'
import  { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid'

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

    const isAuthor = (currentUser && props.paper.authors.find((a) => a.userId == currentUser.id) ? true : false)
    const isOwner = (currentUser && isAuthor && props.paper.authors.find((a) => a.userId == currentUser.id).owner ? true : false)
    const reviewerIsAuthor = (props.paper.authors.find((a) => a.userId == props.selectedReview.userId) ? true : false)
    const viewOnly = ! props.paper.isDraft

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
            status: 'accepted'
        }
        setRequestId(dispatch(patchReview(props.paper.id, reviewPatch)))
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
            status: 'rejected'
        }
        setRequestId(dispatch(patchReview(props.paper.id, reviewPatch)))
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
    
    if ( props.selectedReview ) {

        let recommendation = null
        if ( props.selectedReview.status !== 'in-progress' ) {
            let message = null
            if ( props.selectedReview.recommendation == 'commentary' ) {
                message = (<div className="commentary"><ChatBubbleLeftRightIcon /> Commentary</div>)
            } else if ( props.selectedReview.recommendation == 'approve' ) {
                message = (<div className="approved"> <CheckCircleIcon /> Recommends Approval</div>)
            } else if ( props.selectedReview.recommendation == 'request-changes' ) {
                message = (<div className="request-changes"><ClipboardDocumentListIcon/> Recommends Changes</div>)
            } else if ( props.selectedReview.recommendation == 'reject' ) {
                message = (<div className="rejected"><XCircleIcon /> Recommends Rejection</div>)
            }

            recommendation = (
                <div className="recommendation">
                    {message}
                </div>
            )
        } else {
            recommendation = (<div className="recommendation">Unfinished</div>)
        }
         

        return (
            <div className="review-summary">
                <div className="summary">
                    <div className="reviewer"><UserTag id={props.selectedReview.userId}/> submitted <a href={`/paper/${props.paper.id}/timeline#review-${props.selectedReview.id}`}>review #{props.selectedReview.id}</a> <DateTag timestamp={props.selectedReview.updatedDate} type="full" /></div>
                    { recommendation }
                    <div className="summary-text"><ReactMarkdown>{props.selectedReview.summary}</ReactMarkdown></div>
                </div>
            </div>
        )
    } else {
        return null
    }

}

export default ReviewSummaryView 
