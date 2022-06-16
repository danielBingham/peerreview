import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import Spinner from '/components/Spinner'

import ReviewSummaryView from './ReviewSummaryView'
import ReviewSummaryForm from './ReviewSummaryForm'

import './ReviewHeaderView.css'

const ReviewHeaderView = function(props) {
    const dispatch = useDispatch()

    return (
        <div className="review-header">
            <ReviewSummaryView paper={props.paper} />
            <ReviewSummaryForm paper={props.paper} />
        </div>
    )
}

export default ReviewHeaderView
