import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import {  newReview, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'
import { FloatingMenu, FloatingMenuHeader, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import UserTag from '/components/users/UserTag'
import PaperVersionSelector from '/components/papers/view/controls/PaperVersionSelector'

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

    const selectedReview = useSelector(function(state) {
        if ( reviewId && state.reviews.dictionary[reviewId] ) {
            return state.reviews.dictionary[reviewId]
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

    // ================= User Action Handling  ================================
    
    const dispatch = useDispatch()

    const startReview = function(event) {
        if ( ! reviewInProgress ) {
            setPostReviewRequestId(dispatch(newReview(props.paperId, props.versionNumber, currentUser.id)))
        }
    }

    const setReview = function(review) {
        if ( review ) {
            searchParams.set('review', review.id)
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
    if ( paper.isDraft && reviewInProgress ) {
        content = ( 
            <>
                <div className="instructions">Currently reviewing version { props.versionNumber }.  Click anywhere on the document to add a comment.  Write review summary and make a recommentation below.  New comment threads will not be public until the review is submitted.  Comments added to existing threads are immediately public.</div>
                <ReviewSummaryForm paper={paper} versionNumber={props.versionNumber} selectedReview={reviewInProgress} /> 
            </>
        )
    } else {
        const reviewViews = []
        reviewViews.push(
            <FloatingMenuItem key="all" className="review-option" onClick={(e) => setReview(null) }>
                Comments from All Reviews
            </FloatingMenuItem>
        )
        for(const review of reviews) {
            reviewViews.push(
                <FloatingMenuItem key={review.id} className="review-option" onClick={(e) => setReview(review) }>
                    Review #{review.id} by <UserTag id={review.userId} link={false} />
                </FloatingMenuItem>
            )
        }
       
        let selectedReviewView= null
        if ( selectedReview ) {
            selectedReviewView = (
                <ReviewSummaryView paper={paper} versionNumber={props.versionNumber} selectedReview={selectedReview} />
            )
        }

        let trigger = 'Comments from All Reviews'
        if ( selectedReview ) {
            trigger = (
                <span>Review #{selectedReview.id} by <UserTag id={selectedReview.userId} link={false} /></span>
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
                </div>
                { selectedReview && <div className="selected-review">
                    { selectedReviewView }
                </div> }
            </>
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
