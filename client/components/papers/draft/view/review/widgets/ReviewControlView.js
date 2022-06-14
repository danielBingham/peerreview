import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {  patchPaper, cleanupRequest as cleanupPaperRequest } from '/state/papers'
import {  patchReview, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

const ReviewControlView = function(props) {
    const [ patchPaperRequestId, setPatchPaperRequestId ] = useState(null)
    const [ patchReviewRequestId, setPatchReviewRequestId ] = useState(null)

    const dispatch = useDispatch()

    // ================= Request Tracking =====================================
    const patchReviewRequest = useSelector(function(state) {
        if ( ! patchReviewRequestId ) {
            return null
        } else {
            return state.reviews.requests[patchReviewRequestId]
        }
    })

    const patchPaperRequest = useSelector(function(state) {
        if ( ! patchPaperRequestId ) {
            return null
        } else {
            return state.papers.requests[patchPaperRequestId]
        }
    })
    // ================= Redux State ==========================================
    //

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const isAuthor = (currentUser && props.paper.authors.find((a) => a.user.id == currentUser.id) ? true : false)
    const isOwner = (currentUser && isAuthor && props.paper.authors.find((a) => a.user.id == currentUser.id).owner ? true : false)

    // ================= User Action Handling  ================================

    const finishReview = function(event) {
        event.preventDefault()

        const reviewPatch = {
            id: props.reviewInProgress.id,
            paperId: props.paper.id,
            status: 'approved'
        }
        setPatchReviewRequestId(dispatch(patchReview(reviewPatch)))
    }

    const publishPaper = function(event) {
        event.preventDefault()

        const paperPatch = {
            id: props.paper.id,
            isDraft: false
        }
        setPatchPaperRequestId(dispatch(patchPaper(paperPatch)))
    }

    useEffect(function() {

        if ( patchPaperRequestId && patchPaperRequest && patchPaperRequest.state == 'fulfilled' ) {
            const paperPath = '/paper/' + paper.id
            navigate(paperPath)
        }

        return function cleanup() {
            if ( patchPaperRequest ) {
                dispatch(cleanupPaperRequest(patchPaperRequestId))
            }
        }

    })

    let contents = ''
    if ( props.reviewInProgress && ! isAuthor) {
        contents = (
            <button onClick={finishReview}>Finish Review</button> 
        )
    } else if ( ! props.reviewInProgress && ! isAuthor ) {
        contents = (
            <button>Start a Review</button>
        )
    } else if ( isAuthor ) {
        contents = (
            <button onClick={publishPaper}>Publish</button>
        )
    }

    return (
        <div className="review-controls">
            { contents }
        </div>
    )

}

export default ReviewControlView
