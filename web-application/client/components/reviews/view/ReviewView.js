import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EllipsisVerticalIcon } from '@heroicons/react/24/solid'

import ReviewSummaryForm from '/components/reviews/widgets/ReviewSummaryForm'
import ReviewSummaryView from '/components/reviews/widgets/ReviewSummaryView'
import CommentThreadView from './CommentThreadView'

import Spinner from '/components/Spinner'

import './ReviewView.css'

const ReviewView = function({ id, paperId, versionNumber }) {
    
    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const review = useSelector(function(state) {
        if ( ! state.reviews.dictionary[paperId] ) {
            return null
        }

        return state.reviews.dictionary[paperId][id]
    })

    const pages = []
    const commentThreadViews = []

    for(let thread of review.threads) {
        commentThreadViews.push(
            <div key={thread.id}>
                <EllipsisVerticalIcon className="ellipsis" />
                <CommentThreadView id={thread.id} reviewId={review.id} paperId={paper.id} versionNumber={versionNumber} />
            </div>
        )
    }

    let summary = null
    if ( review.status == 'in-progress' && paper.isDraft ) {
        summary = ( 
            <ReviewSummaryForm paper={paper} versionNumber={versionNumber} selectedReview={review} /> 
        )
    } else {
        summary = (
            <ReviewSummaryView paper={paper} versionNumber={versionNumber} selectedReview={review} />
        )
    }

    return (
        <div id={`review-${id}`} className="review-view">
            { summary }
            { commentThreadViews }
        </div>
    )

}

export default ReviewView
