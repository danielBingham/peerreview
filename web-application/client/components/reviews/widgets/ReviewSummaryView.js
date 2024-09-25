import React from 'react'
import ReactMarkdown from 'react-markdown'

import { CheckCircleIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, XCircleIcon } from '@heroicons/react/24/outline'

import UserTag from '/components/users/UserTag'
import DateTag from '/components/DateTag'
import VisibilityBar from '/components/papers/view/timeline/events/controls/VisibilityBar'

import './ReviewSummaryView.css'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 */
const ReviewSummaryView = function(props) {
    
    // ======= Request Tracking =====================================
    
    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================

    // ======= Effect Handling ======================================

    // ======= Render ===============================================
    
    if ( props.selectedReview ) {

        let recommendation = null
        if ( props.selectedReview.status !== 'in-progress' ) {
            let message = null
            if ( props.selectedReview.recommendation == 'commentary' ) {
                message = (<span className="commentary"><ChatBubbleLeftRightIcon /> left commentary</span>)
            } else if ( props.selectedReview.recommendation == 'approve' ) {
                message = (<span className="approved"> <CheckCircleIcon /> recommended approval</span>)
            } else if ( props.selectedReview.recommendation == 'request-changes' ) {
                message = (<span className="request-changes"><ClipboardDocumentListIcon/> recommended changes</span>)
            } else if ( props.selectedReview.recommendation == 'reject' ) {
                message = (<span className="rejected"><XCircleIcon /> recommended rejection</span>)
            }

            recommendation = (
                <span className="recommendation">
                    {message}
                </span>
            )
        } else {
            recommendation = (<span className="recommendation">is reviewing</span>)
        }
         

        return (
            <div className="review-summary">
                <div className="summary">
                    <div className="header">
                        <div className="left">
                            <UserTag id={props.selectedReview.userId}/> { recommendation } <a href={`/paper/${props.paper.id}/timeline#review-${props.selectedReview.id}`}><DateTag timestamp={props.selectedReview.updatedDate} type="full" /></a></div>
                    </div>
                    <VisibilityBar eventId={props.eventId} />
                    { props.selectedReview.summary && <div className="summary-text"><ReactMarkdown>{props.selectedReview.summary}</ReactMarkdown></div> }
                </div>
            </div>
        )
    } else {
        return null
    }

}

export default ReviewSummaryView 
