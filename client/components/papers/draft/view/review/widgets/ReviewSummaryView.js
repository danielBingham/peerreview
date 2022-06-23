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

    const selectedReview = useSelector(function(state) {
        return state.reviews.selected[props.paper.id]
    })

    if ( selectedReview && selectedReview.status == 'in-progress' ) {
        return
    } else if ( selectedReview ) {
        const id = `selected-review-${selectedReview.id}`
        return (
            <div id={id} className="review-summary">
                <div className="datetime">{selectedReview.createdDate}</div>
                <div className="recommendation">{selectedReview.recommendation}</div>
                <div className="summary"><ReactMarkdown>{selectedReview.summary}</ReactMarkdown></div>
            </div>
        )
    } else {
        return
    }

}

export default ReviewSummaryView 
