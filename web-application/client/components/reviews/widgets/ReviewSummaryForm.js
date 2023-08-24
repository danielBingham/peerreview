import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { CheckCircleIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, XCircleIcon } from '@heroicons/react/24/outline'

import { patchReview, deleteReview, cleanupRequest} from '/state/reviews'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './ReviewSummaryForm.css'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 * @param {Object} props    Standard React props object.
 * @param {Object} props.paper  The paper we're rendering review summaries for.
 * @param {integer} props.versionNumber The version of the paper we're currently viewing.
 * @param {Object} props.selectedReview The currently selected review.
 */
const ReviewSummaryForm = function(props) {

    // ======= Render State =========================================

    const [ summary, setSummary ] = useState('')
    const [ recommendation, setRecommendation ] = useState('request-changes')
    const [ errorType, setErrorType ] = useState(null)

    // ======= Request Tracking =====================================
    
    const [patchReviewRequestId, setPatchReviewRequestId] = useState(null)
    const patchReviewRequest = useSelector(function(state) {
        if ( patchReviewRequestId) {
            return state.reviews.requests[patchReviewRequestId]
        } else {
            return null
        }
    })

    const [deleteReviewRequestId, setDeleteReviewRequestId] = useState(null)
    const deleteReviewRequest = useSelector(function(state) {
        if ( deleteReviewRequestId) {
            return state.reviews.requests[deleteReviewRequestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const reviewInProgress = useSelector(function(state) {
        if ( ! state.reviews.inProgress[props.paper.id] ) {
            return null
        } else if ( ! state.reviews.inProgress[props.paper.id][props.versionNumber] ) {
            return null
        }
        return state.reviews.inProgress[props.paper.id][props.versionNumber]
    })

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch()

    const finish = function(event) {
        event.preventDefault()

        // Determine if there are any comments still in progress, if there are,
        // bail out.
        for ( const thread of reviewInProgress.threads ) {
            for( const comment of thread.comments ) {
                if ( comment.status == 'in-progress' ) {
                    setErrorType('comment-in-progress')
                    return
                }
            }
        }

        const reviewPatch = {
            id: reviewInProgress.id,
            summary: summary,
            recommendation: recommendation,
            status: 'submitted'
        }

        setPatchReviewRequestId(dispatch(patchReview(props.paper.id, reviewPatch)))
    }

    const cancel = function(event) {
        event.preventDefault()

        setDeleteReviewRequestId(dispatch(deleteReview(reviewInProgress)))
    }

    const commitChange = function(event) {
        const reviewPatch = {
            id: reviewInProgress.id,
            summary: summary,
            recommendation: recommendation
        }
        setPatchReviewRequestId(dispatch(patchReview(props.paper.id, reviewPatch)))
    }

    // ======= Effect Handling ======================================

    useLayoutEffect(function() {
        if ( reviewInProgress) {
            setSummary(reviewInProgress.summary)
            setRecommendation(reviewInProgress.recommendation)
        }
    }, [ reviewInProgress])

    // Cleanup request tracking.
    useEffect(function() {
        return function cleanup() {
            if ( deleteReviewRequestId ) {
                dispatch(cleanupRequest({ requestId: deleteReviewRequestId }))
            }
        }
    }, [ deleteReviewRequestId ])

    // Cleanup request tracking.
    useEffect(function() {
        return function cleanup() {
            if ( patchReviewRequestId ) {
                dispatch(cleanupRequest({ requestId: patchReviewRequestId }))
            }
        }
    }, [ patchReviewRequestId ])

    // ======= Render ===============================================
    
    if ( ! reviewInProgress) {
        return (
            <div className="review-summary-form" style={ { display: 'none' }}>
            </div>
        )
    } else {
        return (
            <div id={reviewInProgress.id} 
                className="review-summary-form" 
                style={ props.selectedReview && reviewInProgress.id == props.selectedReview.id ? { display: 'block' } : { display: 'none' } }
            >
                <div className="summary-wrapper">
                    <div className="summary-field">
                        <textarea 
                            onChange={(e) => setSummary(e.target.value)} 
                            onBlur={commitChange} 
                            value={summary}
                            placeholder="Write a summary of your review..."
                        >
                        </textarea>
                    </div>
                    <div className="recommendation-wrapper">
                        { /*<select name="recommendation-field" 
                            onChange={(e) => setRecommendation(e.target.value)}
                            onBlur={commitChange} 
                            value={recommendation} 
                        >

                                <option value="commentary">Commentary (No recommendation)</option>
                                <option value="request-changes">Recommend Changes</option>
                                <option value="approve">Recommend Approval</option>
                                <option value="reject">Recommend Rejection</option>
                        </select> */ }
                        <div className="recommendation-option">
                            <input 
                                type="radio" 
                                name="recommendation" 
                                checked={ recommendation == 'commentary' }
                                onChange={(e) => setRecommendation('commentary')}
                                onBlur={commitChange}
                                value="commentary" />
                            <label htmlFor="commentary"><ChatBubbleLeftRightIcon/>Commentary</label>
                            <div className="explanation">Add commentary to the draft with out making an explicit recommendation.</div>
                        </div>
                        <div className="recommendation-option">
                            <input 
                                type="radio" 
                                name="recommendation" 
                                checked={ recommendation == 'request-changes' }
                                onChange={(e) => setRecommendation('request-changes')}
                                onBlur={commitChange}
                                value="request-changes" />
                            <label htmlFor="request-changes"><ClipboardDocumentListIcon/>Request Changes</label>
                            <div className="explanation">Recommend that authors make the changes outlined in this review.</div>
                        </div>
                        <div className="recommendation-option">
                            <input 
                                type="radio" 
                                name="recommendation" 
                                checked={ recommendation == 'reject' }
                                onChange={(e) => setRecommendation('reject')}
                                onBlur={commitChange}
                                value="reject" />
                            <label htmlFor="approve"><XCircleIcon/>Reject</label>
                            <div className="explanation">Recommend that the draft be rejected.</div>
                        </div>
                        <div className="recommendation-option">
                            <input 
                                type="radio" 
                                name="recommendation" 
                                checked={ recommendation == 'approve' }
                                onChange={(e) => setRecommendation('approve')}
                                onBlur={commitChange}
                                value="approve" />
                            <label htmlFor="approve"><CheckCircleIcon/>Approve</label>
                            <div className="explanation">Recommend that the draft be approved with out additional changes.</div>
                        </div>
                        <div className="submission-buttons">
                            <Button type="secondary-warn" onClick={cancel} >Cancel Review</Button>
                            <Button type="primary" onClick={finish} >Finish Review</Button>
                        </div>
                        <div className="submission-error" style={ ( errorType ? { display: 'block' } : { display: 'none' } ) }>
                            { errorType == 'comment-in-progress' && 'There are still comments in progress on your review.  Submit or cancel all comments and then submit your review.' }
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}

export default ReviewSummaryForm 
