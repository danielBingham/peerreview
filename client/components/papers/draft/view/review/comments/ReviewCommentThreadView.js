import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { postReviewComments, cleanupRequest } from '/state/reviews'

import ReviewCommentForm from './ReviewCommentForm'
import ReviewCommentView from './ReviewCommentView'

import Spinner from '/components/Spinner'
import './ReviewCommentThreadView.css'

const ReviewCommentThreadView = function(props) {
    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.reviews.requests[requestId]
        } else {
            return null
        }
    })

    const review = useSelector(function(state) {
        return state.reviews.dictionary[props.paper.id][props.thread.reviewId]
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const thread = useSelector(function(state) {
        return state.reviews.dictionary[props.paper.id][props.thread.reviewId].threads.find((t) => t.id == props.thread.id)
    })

    const newComment = function(event) {
        const comment = {
            threadId: props.thread.id,
            userId: currentUser.id,
            threadOrder: props.thread.comments.length,
            status: 'in-progress',
            content: ''
        }
        setRequestId(dispatch(postReviewComments(props.paper.id, review.id, props.thread.id, comment))) 
    }

    useEffect(function() {
        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }
    }, [])

    const inProgress = false
    const commentViews = []
    for ( const comment of thread.comments) {
        if ( comment.status == 'in-progress' && comment.userId == currentUser.id) {
            const inProgress = true
            commentViews.push(<ReviewCommentForm key={comment.id} paper={props.paper} review={review} thread={props.thread} comment={comment} />)
        } else if ( comment.status == 'posted' ) {
            commentViews.push(<ReviewCommentView key={comment.id} paper={props.paper} review={review} thread={props.thread} comment={comment} />)
        }
    }

    const position = {
        top: props.position.top + 'px',
        left: props.position.left + 'px'
    }

    const id = `comment-thread-${props.thread.id}`
    return (
        <div key={props.thread.id} id={id} className="comment-thread" style={ position }>
            { commentViews }
            { ! inProgress && <div onClick={newComment} className="reply">Post a reply...</div> }
        </div>
    )
}
export default ReviewCommentThreadView
