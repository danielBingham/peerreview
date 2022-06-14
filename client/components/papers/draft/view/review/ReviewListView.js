import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import Spinner from '/components/Spinner'

import ReviewListItemView from './ReviewListItemView'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 * TODO
 * Show the review in progress among the other reviews with some sort of
 * indicator to show that it's in progress.
 *
 */
const ReviewListView = function(props) {
    
    const reviews = []
    for(const review of props.reviews) {
        reviews.push(<ReviewListItemView key={review.id} review={review} />)
    }

    return (
        <div className="review-list">
            { reviews }
        </div>
    )

}

export default ReviewListView 
