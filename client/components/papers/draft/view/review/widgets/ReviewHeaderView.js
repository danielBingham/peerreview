import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import Spinner from '/components/Spinner'

import ReviewSummaryView from './ReviewSummaryView'
import ReviewSummaryForm from './ReviewSummaryForm'

import './ReviewHeaderView.css'

/**
 * Render the Header for the Draft View page.  Currently used on `/draft/:id`
 *
 * @param {Object} props    Standard React props object.
 * @param {Object} props.paper  Populated paper object. The draft we're viewing.
 * @param {integer} props.versionNumber The version of the paper we're currently viewing.
 */
const ReviewHeaderView = function(props) {
    const dispatch = useDispatch()

    const [ searchParams, setSearchParams ] = useSearchParams()

    const selectedReviewId = searchParams.get('review')
    const selectedReview = useSelector(function(state) {
        if ( selectedReviewId && selectedReviewId != 'all' ) {
            if ( state.reviews.dictionary[props.paper.id] ) {
                return state.reviews.dictionary[props.paper.id][selectedReviewId]
            } else {
                return null
            }
        } else {
            return null
        }
    })

    let content = null 
    if ( selectedReview ) {
        if ( selectedReview.status == 'in-progress' ) {
            content = ( <ReviewSummaryForm paper={props.paper} versionNumber={props.versionNumber} selectedReview={selectedReview} /> )
        } else {
            content = ( <ReviewSummaryView paper={props.paper} versionNumber={props.versionNumber} selectedReview={selectedReview} /> )
        }
    } else if ( selectedReviewId == 'all' ) {
        content = (
            <p style={{ textAlign: 'center' }}>Viewing comments from all reviews.  Select a review to see
                summary details and only comments from that review.</p>
        )
    } else {
        content = (
            <p style={{ textAlign: 'center' }}>Select a review to see
                summary details and comments from that review.</p>
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
