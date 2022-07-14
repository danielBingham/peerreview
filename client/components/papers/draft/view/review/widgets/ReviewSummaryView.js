import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

import { useDispatch, useSelector } from 'react-redux'

import Spinner from '/components/Spinner'

import './ReviewSummaryView.css'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 */
const ReviewSummaryView = function(props) {

    if ( props.selectedReview && props.selectedReview.status == 'in-progress' ) {
        return null
    } else if ( props.selectedReview ) {
        const id = `selected-review-${props.selectedReview.id}`
        return (
            <div id={id} className="review-summary">
                <div className="datetime">{props.selectedReview.createdDate}</div>
                <div className="recommendation">{props.selectedReview.recommendation}</div>
                <div className="summary"><ReactMarkdown>{props.selectedReview.summary}</ReactMarkdown></div>
            </div>
        )
    } else {
        return null
    }

}

export default ReviewSummaryView 
