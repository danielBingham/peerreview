import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { Document } from 'react-pdf/dist/esm/entry.webpack'

import { EllipsisVerticalIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, XCircleIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'

import Spinner from '/components/Spinner'
import DateTag from '/components/DateTag'

import JournalTag from '/components/journals/JournalTag'

import ReviewSummaryForm from '/components/reviews/widgets/ReviewSummaryForm'
import ReviewSummaryView from '/components/reviews/widgets/ReviewSummaryView'
import CommentThreadView from '/components/reviews/view/CommentThreadView'
import UserProfileImage from '/components/users/UserProfileImage'

import FeedEventPaperComponent from './components/FeedEventPaperComponent'

import './FeedPaperReviewView.css'

const FeedPaperReviewView = function({ eventId }) {
    
    const event = useSelector(function(state) {
        if ( state.paperEvents.dictionary[eventId] ) {
            return state.paperEvents.dictionary[eventId]
        } else {
            return null
        }
    })

    const paper = useSelector(function(state) {
        if ( event && state.papers.dictionary[event.paperId] ) {
            return state.papers.dictionary[event.paperId]
        } else {
            return null
        }
    })


    const review = useSelector(function(state) {
        if ( event && state.reviews.dictionary[event.reviewId] ) {
            return state.reviews.dictionary[event.reviewId]
        } else {
            return null
        }
    })

    const submission = useSelector(function(state) {
        if ( event && state.journalSubmissions.dictionary[event.submissionId]) {
            return state.journalSubmissions.dictionary[event.submissionId]
        } else {
            return null
        }
    })

    // ====== User Action Handling  ================================


    // ======= Effect Handling ======================================

    // ====== Render ===============================================
    

    let summary = null
    summary = (
        <ReviewSummaryView paper={paper} versionNumber={event.version} selectedReview={review} />
    )

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
        <div id={`review-${review.id}`} className="feed-paper-review-view">
            <TimelineItem>
                <TimelineIcon>
                    { timelineIcon } 
                </TimelineIcon>
                <TimelineItemWrapper>
                    New review for submission to <JournalTag id={submission.journalId} /> -- <DateTag timestamp={event.eventDate} />
                    <FeedEventPaperComponent paperId={event.paperId} />
                    <div className="review-view-summary-wrapper">
                        { summary }
                    </div>
                    <div className="comments">
                        <Link to={`/paper/${event.paperId}/timeline#review-${review.id}`}>View full review with { review.threads.length } comments.</Link>
                    </div>
                </TimelineItemWrapper>
            </TimelineItem>
        </div>
    )

}

export default FeedPaperReviewView
