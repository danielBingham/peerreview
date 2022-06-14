import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import Spinner from '/components/Spinner'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 */
const ReviewListItemView = function(props) {

    return (
        <div className="review-list-item">
            <div className="created">{props.review.createdDate}</div>
            <div className="status">{props.review.status}</div>
            <div className="summary">{props.review.summary}</div>
        </div>
    )

}

export default ReviewListItemView 
