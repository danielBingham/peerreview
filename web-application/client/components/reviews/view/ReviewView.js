import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EllipsisVerticalIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, XCircleIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'

import ReviewSummaryForm from '/components/reviews/widgets/ReviewSummaryForm'
import ReviewSummaryView from '/components/reviews/widgets/ReviewSummaryView'
import CommentThreadView from './CommentThreadView'
import UserProfileImage from '/components/users/UserProfileImage'

import Spinner from '/components/Spinner'

import './ReviewView.css'

const ReviewView = function({ id, paperId, versionNumber }) {
    
    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const review = useSelector(function(state) {
        if ( ! state.reviews.dictionary[id] ) {
            return null
        }

        return state.reviews.dictionary[id]
    })

    const user = useSelector(function(state) {
        if ( ! review || ! state.users.dictionary[review.userId]) {
            return null
        } else {
            return state.users.dictionary[review.userId]
        }
    })

    useEffect(function() {
        // Scroll to the hash once the document has loaded.
        if ( document.location.hash == `#review-${review.id}`) {
            document.querySelector(document.location.hash).scrollIntoView()
        }
    }, [ document.location.hash ])

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
