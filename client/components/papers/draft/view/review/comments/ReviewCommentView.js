import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { getUser, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'
import './ReviewCommentView.css'

const ReviewCommentView = function(props) {
    const [requestId, setRequestId] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        return state.users.requests[requestId]
    })

    const review = useSelector(function(state) {
        return state.reviews.dictionary[props.paper.id][props.review.id]
    })

    const author = useSelector(function(state) {
        return state.users.users[props.comment.userId]
    })

    useEffect(function() {
        if ( ! requestId ) {
            setRequestId(dispatch(getUser(props.comment.userId)))
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }
    }, [ requestId ])


    if ( author ) {
        return (
            <div key={props.comment.id} id={props.comment.id} className="comment-outer">
                <div className="author">{author.name}</div>
                <div className="datetime">{props.comment.updatedDate}</div>
                <div className="comment-inner" style={{ padding: '5px' }} >
                    {props.comment.content}
                </div>
            </div>
        )
    } else {
        return (
            <Spinner />
        )
    }
}
export default ReviewCommentView
