import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EllipsisVerticalIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, XCircleIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'

import ReviewSummaryForm from '/components/reviews/widgets/ReviewSummaryForm'
import ReviewSummaryView from '/components/reviews/widgets/ReviewSummaryView'
import CommentThreadView from './CommentThreadView'

import Spinner from '/components/Spinner'

import './ReviewView.css'

const ReviewView = function({ id, eventId, paperId, paperVersionId }) {
    
    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const review = useSelector(function(state) {
        if ( ! state.reviews.dictionary[id] ) {
            return null
        }

        return state.reviews.dictionary[id]
    })

    useEffect(function() {
        if ( ! review ) {
            return
        }

        // Scroll to the hash once the document has loaded.
        if ( document.location.hash == `#review-${review.id}`) {
            document.querySelector(document.location.hash).scrollIntoView()
        }
    }, [ document.location.hash ])

    if ( ! review ) {
        return null
    }

    const commentThreadViews = []

    for(let thread of review.threads) {
        commentThreadViews.push(
            <div key={thread.id}>
                <EllipsisVerticalIcon className="ellipsis" />
                <CommentThreadView id={thread.id} reviewId={review.id} paperId={paper.id} />
            </div>
        )
    }

    let summary = null
    if ( review.status == 'in-progress' && paper.isDraft ) {
        summary = ( 
            <ReviewSummaryForm paper={paper} paperVersionId={paperVersionId} selectedReview={review} /> 
        )
    } else {
        summary = (
            <ReviewSummaryView eventId={eventId} paper={paper} selectedReview={review} />
        )
    }

    let timelineIcon = null
    if ( review.recommendation == 'commentary' ) {
        timelineIcon = (<div className="commentary"><ChatBubbleLeftRightIcon /></div>)
    } else if ( review.recommendation == 'approve' ) {
        timelineIcon = (<div className="approved"> <CheckCircleIcon /></div>)
    } else if ( review.recommendation == 'request-changes' ) {
        timelineIcon = (<div className="request-changes"><ClipboardDocumentListIcon /></div>)
    } else if ( review.recommendation == 'reject' ) {
        timelineIcon = (<div className="rejected"><XCircleIcon /></div>)
    }

    return (
        <div id={`review-${id}`} className="review-view">
            <TimelineItem>
                <TimelineIcon>
                    { timelineIcon } 
                </TimelineIcon>
                <TimelineItemWrapper>
                    <div className="review-view-summary-wrapper">
                        { summary }
                    </div>
                    { commentThreadViews }
                </TimelineItemWrapper>
            </TimelineItem>
        </div>
    )

}

export default ReviewView
