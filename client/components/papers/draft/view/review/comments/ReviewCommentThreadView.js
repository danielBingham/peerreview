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
            threadOrder: props.thread.comments.length+1,
            status: 'in-progress',
            content: ''
        }
        setRequestId(dispatch(postReviewComments(props.paper.id, review.id, props.thread.id, comment))) 
    }

    const pinClicked = function(event) {
        props.selectThread(thread)
    }

    const threadClicked = function(event) {
        props.selectThread(thread)
    }

    useEffect(function() {
        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }
    }, [])

    if ( ! thread ) {
        return (null)
    }

    let inProgress = false
    const commentViews = []
    const sortedComments = [ ...thread.comments ]
    sortedComments.sort((a,b) => a.threadOrder - b.threadOrder)
    console.log(sortedComments)
    for ( const comment of sortedComments) {
        if ( comment.status == 'in-progress' && comment.userId == currentUser.id) {
            inProgress = true
            commentViews.push(<ReviewCommentForm key={comment.id} paper={props.paper} review={review} thread={props.thread} comment={comment} />)
        } else if ( comment.status == 'posted' ) {
            commentViews.push(<ReviewCommentView key={comment.id} paper={props.paper} review={review} thread={props.thread} comment={comment} />)
        }
    }

    const threadPosition = {
        top: props.threadPosition.top + 'px',
        left: props.threadPosition.left + 'px'
    }

    const pinPosition = {
        top: props.pinPosition.top + 'px',
        left: props.pinPosition.left + 'px'
    }

    const id = `comment-thread-${props.thread.id}`
    return (
        <div className="comment-thread-outer">
            <div className={( props.selected ? "pin selected "+props.paper.fields[0].type : "pin "+props.paper.fields[0].type)} onClick={pinClicked} style={ pinPosition }></div> 
            <div key={props.thread.id} id={id} onClick={threadClicked} className={( props.selected ? "comment-thread selected" : "comment-thread")} style={ threadPosition}>
                { commentViews }
                { ! inProgress && <div onClick={newComment} className="reply">Post a reply...</div> }
            </div>
        </div>
    )
}
export default ReviewCommentThreadView
