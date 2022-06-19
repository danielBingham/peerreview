import React, { useState, useEffect, useLayoutEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { patchReview, setInProgress, cleanupRequest} from '/state/reviews'

import Spinner from '/components/Spinner'

import './ReviewSummaryForm.css'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 */
const ReviewSummaryForm = function(props) {
    const [ summary, setSummary ] = useState('')
    const [ recommendation, setRecommendation ] = useState('request-changes')

    const [patchReviewRequestId, setPatchReviewRequestId] = useState(null)

    const dispatch = useDispatch()

    const patchReviewRequest = useSelector(function(state) {
        if ( patchReviewRequestId) {
            return state.reviews.requests[patchReviewRequestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const selectedReview = useSelector(function(state) {
        return state.reviews.selected[props.paper.id]
    })

    const reviewInProgress = useSelector(function(state) {
        return state.reviews.inProgress[props.paper.id]
    })

    const finish = function(event) {
        event.preventDefault()

        const reviewPatch = {
            id: reviewInProgress.id,
            paperId: props.paper.id,
            summary: summary,
            recommendation: recommendation,
            status: 'submitted'
        }

        setPatchReviewRequestId(dispatch(patchReview(reviewPatch)))
    }

    const commitChange = function(event) {
        const reviewPatch = {
            id: reviewInProgress.id,
            paperId: props.paper.id,
            summary: summary,
            recommendation: recommendation,
            status: reviewInProgress.status
        }
        setPatchReviewRequestId(dispatch(patchReview(reviewPatch)))
    }

    useEffect(function() {

        return function cleanup() {
            if ( patchReviewRequest ) {
                dispatch(cleanupRequest(patchReviewRequest))
            }
        }
    }, [])

    useLayoutEffect(function() {
        if ( reviewInProgress) {
            setSummary(reviewInProgress.summary)
            setRecommendation(reviewInProgress.recommendation)
        }
    }, [ reviewInProgress])

    if ( ! reviewInProgress) {
        return (
            <div className="review-summary-form" style={ { display: 'none' }}>
            </div>
        )
    } else {
        return (
            <div id={reviewInProgress.id} 
                className="review-summary-form" 
                style={ selectedReview && reviewInProgress.id == selectedReview.id ? { display: 'block' } : { display: 'none' } }
            >
                <div className="summary">
                    <div className="summary">
                        <textarea 
                            rows="10"
                            cols="80"
                            onChange={(e) => setSummary(e.target.value)} 
                            onBlur={commitChange} 
                            value={summary}
                        >
                        </textarea>
                    </div>
                    <div className="recommendation">
                        <select name="recommendation" 
                            onChange={(e) => setRecommendation(e.target.value)}
                            onBlur={commitChange} 
                            value={recommendation} 
                        >
                                <option value="request-changes">Suggest Changes</option>
                                <option value="approve">Recommend Approval</option>
                                <option value="reject">Recommend Rejection</option>
                        </select>
                        <button name="finish" onClick={finish} >Finish Review</button>
                    </div>
                </div>
            </div>
        )
    }

}

export default ReviewSummaryForm 
