import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import Spinner from '/components/Spinner'

import ReviewSummaryView from './ReviewSummaryView'
import ReviewSummaryForm from './ReviewSummaryForm'

import './ReviewHeaderView.css'

const ReviewHeaderView = function(props) {
    const dispatch = useDispatch()

    const selectedReview = useSelector(function(state) {
        return state.reviews.selected[props.paper.id]
    })

    let content = null 
    if ( selectedReview ) {
        if ( selectedReview.status == 'in-progress' ) {
            content = ( <ReviewSummaryForm paper={props.paper} /> )
        } else {
            content = ( <ReviewSummaryView paper={props.paper} /> )
        }
    } else {
        content = (
            <p>Viewing comments from all reviews.  Select a review to see
                summary details and only comments from that review.</p>
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
