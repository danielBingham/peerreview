import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import {  newReview, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'
import { FloatingMenu, FloatingMenuHeader, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import UserTag from '/components/users/UserTag'
import PaperVersionSelector from '/components/papers/view/controls/PaperVersionSelector'
import StartReviewButton from '/components/papers/view/controls/StartReviewButton'

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
    const reviewId = searchParams.get('review')

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

    const reviews = useSelector(function(state) {
        const results = []
        if ( state.reviews.queries[props.paperId]?.list) {
            for(const id of state.reviews.queries[props.paperId].list) {
                if ( state.reviews.dictionary[id].version == props.versionNumber ) {
                    results.push(state.reviews.dictionary[id])
                }
            }
        }
        return results
    })

    let selectedReview = useSelector(function(state) {
        if ( reviewId && reviewId !== 'none'
            && state.reviews.dictionary[reviewId] 
            && state.reviews.dictionary[reviewId].version == props.versionNumber) 
        {
            return state.reviews.dictionary[reviewId]
        } else {
            return null
        }
    })

    const event = useSelector(function(state) {
        if ( selectedReview ) {
            for( const [id, event] of Object.entries(state.paperEvents.dictionary)) {
                if ( event.reviewId == selectedReview.id ) {
                    return event
                }
            }
            return null
        } else {
            return null
        }
    })

    const reviewInProgress = useSelector(function(state) {
        if ( state.reviews.inProgress[props.paperId] ) {
            return state.reviews.inProgress[props.paperId][props.versionNumber]
        } else {
            return null
        }
    })

    if ( selectedReview && reviewInProgress && selectedReview.id == reviewInProgress.id ) {
        selectedReview = null
    }

    // ================= User Action Handling  ================================
    
    const dispatch = useDispatch()

    const setReview = function(reviewId) {
        if ( reviewId ) {
            searchParams.set('review', reviewId)
            setSearchParams(searchParams)
        } else {
            searchParams.delete('review')
            setSearchParams(searchParams)
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

    const reviewViews = []
    reviewViews.push(
        <FloatingMenuItem key="all" className="review-option" onClick={(e) => setReview(null) }>
            Comments from All Reviews
        </FloatingMenuItem>
    )
    reviewViews.push(
        <FloatingMenuItem key="none" className="review-option" onClick={(e) => setReview('none') }>
            No Comments 
        </FloatingMenuItem>
    )
    for(const review of reviews) {
        if ( reviewInProgress && review.id == reviewInProgress.id ) {
            continue
        }

        reviewViews.push(
            <FloatingMenuItem key={review.id} className="review-option" onClick={(e) => setReview(review.id) }>
                Review #{review.id} by <UserTag id={review.userId} link={false} />
            </FloatingMenuItem>
        )
    }

    let selectedReviewView = null
    let reviewInProgressView = null

    if ( reviewInProgress ) {
        reviewInProgressView = ( 
            <>
                <ReviewSummaryForm paper={paper} versionNumber={props.versionNumber} selectedReview={reviewInProgress} /> 
            </>
        )
    }

    if ( selectedReview && event ) {
            selectedReviewView = (
                <ReviewSummaryView eventId={event.id} paper={paper} versionNumber={props.versionNumber} selectedReview={selectedReview} />
            )
    } else if ( selectedReview && ! event && selectedReview.id != reviewInProgress.id) {
        selectedReviewView = (
            <Spinner local={true} />
        )
    }

    let trigger = (<span>Comments from All Reviews</span>)
    if ( selectedReview ) {
        trigger = (
            <span>Review #{selectedReview.id} by <UserTag id={selectedReview.userId} link={false} /></span>
        )
    } else if ( reviewId == 'none' ) {
        trigger = (
            <span>No comments</span>
        )
    }

    content = (
        <>
            <div className="controls">
                <PaperVersionSelector paperId={props.paperId} />  
                <FloatingMenu className="review-selector" closeOnClick={true}>
                    <FloatingMenuTrigger>Viewing: { trigger }</FloatingMenuTrigger>
                    <FloatingMenuBody className="review-menu-body">
                        <FloatingMenuHeader>
                            Select a review to view
                        </FloatingMenuHeader>
                        { reviewViews }
                    </FloatingMenuBody>
                </FloatingMenu>
                <div className="start-review">
                    <StartReviewButton id={paper.id} />
                </div>
            </div>
            { selectedReview && <div className="selected-review">
                { selectedReviewView }
            </div> }
            { reviewInProgress && <div className="review-in-progress">
                { reviewInProgressView }
            </div> }
        </>
    )

    return (
        <div className="review-header">
            <div className="inner">
                { content }
            </div>
        </div>
    )
}

export default ReviewHeaderView
