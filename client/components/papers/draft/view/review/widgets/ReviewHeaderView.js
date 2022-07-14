import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import Spinner from '/components/Spinner'

import ReviewSummaryView from './ReviewSummaryView'
import ReviewSummaryForm from './ReviewSummaryForm'

import './ReviewHeaderView.css'

const ReviewHeaderView = function(props) {
    const dispatch = useDispatch()

    let content = null 
    if ( props.selectedReview ) {
        if ( props.selectedReview.status == 'in-progress' ) {
            content = ( <ReviewSummaryForm paper={props.paper} width={props.width} /> )
        } else {
            content = ( <ReviewSummaryView paper={props.paper} selectedReview={props.selectedReview} /> )
        }
    } else {
        content = (
            <p>Viewing comments from all reviews.  Select a review to see
                summary details and only comments from that review.</p>
        )
    }
    return (
        <div className="review-header" style={ { width: props.width+'px' } }>
            <div className="inner">
                { content }
            </div>
        </div>
    )
}

export default ReviewHeaderView
