import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { setSelected } from '/state/reviews'

import Spinner from '/components/Spinner'

import './ReviewListItemView.css'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 */
const ReviewListItemView = function(props) {
    const dispatch = useDispatch()

    const selectReview = function(event) {
        dispatch(setSelected(props.review))
    }

    const classes = 'review-list-item' + (props.selected ? ' selected' : '')
    return (
        <div className={classes} onClick={selectReview} >
            <div className="created">{props.review.createdDate}</div>
            { props.review.status !== 'in-progress' && <div className="recommendation">{props.review.recommendation}</div> }
            { props.review.status == 'in-progress' && <div className="status">{props.review.status}</div> }
        </div>
    )

}

export default ReviewListItemView 
