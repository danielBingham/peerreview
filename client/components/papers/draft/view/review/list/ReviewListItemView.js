import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { setSelected } from '/state/reviews'

import { CheckCircleIcon, AnnotationIcon, XCircleIcon } from '@heroicons/react/outline'
import  { CheckIcon, XIcon } from '@heroicons/react/solid'

import UserTag from '/components/users/UserTag'
import DateTag from '/components/DateTag'
import Spinner from '/components/Spinner'

import './ReviewListItemView.css'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 */
const ReviewListItemView = function(props) {

    const [searchParams, setSearchParams] = useSearchParams()

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch()
    const selectReview = function(event) {
       setSearchParams({ review: props.review.id })  
    }

    // ======= Render ===============================================


    let recommendation = null
    if ( props.review.status !== 'in-progress' ) {
        let message = null
        if ( props.review.recommendation == 'commentary' ) {
            message = (<div className="commentary">Commentary (No recommendation)</div>)
        } else if ( props.review.recommendation == 'approve' ) {
            message = (<div className="approved"><CheckCircleIcon /> Recommends Approval</div>)
        } else if ( props.review.recommendation == 'request-changes' ) {
            message = (<div className="request-changes"><AnnotationIcon /> Recommends Changes</div>)
        } else if ( props.review.recommendation == 'reject' ) {
            message = (<div className="rejected"><XCircleIcon /> Recommends Rejection</div>)
        }

        recommendation = (
            <div className="recommendation">
                {message}
            </div>
        )
    }

    let status = null
    if ( props.review.status !== 'submitted' ) {

        let message = null
        if ( props.review.status == 'in-progress' ) {
            message = (<div className="in-progress">Review In Progress</div>)
        } else if ( props.review.status == 'accepted' ) {
            message = (<div className="accepted"><CheckIcon /> Accepted</div>)
        } else if ( props.review.status == 'rejected') {
            message = (<div className="rejected"><XIcon /> Rejected</div>)
        }

        status = (
            <div className="status">
                {message}
            </div>
        )
    }

    const classes = 'review-list-item' + (props.selected ? ' selected' : '')
    return (
        <div className={classes} onClick={selectReview} >
            <UserTag id={props.review.userId} />
            <div className="created"><DateTag timestamp={props.review.createdDate} /></div>
            { recommendation }
            { status }
        </div>
    )

}

export default ReviewListItemView 
