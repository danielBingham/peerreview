import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { deleteReviewComment, patchReviewComment, cleanupRequest } from '/state/reviews'

import Spinner from '/components/Spinner'

const ReviewCommentForm = function(props) {
    const [patchCommentRequestId, setPatchCommentRequestId] = useState(null)
    const [deleteCommentRequestId, setDeleteCommentRequestId] = useState(null)

    const [content, setContent] = useState('')

    const dispatch = useDispatch()


    const patchCommentRequest = useSelector(function(state) {
        if ( patchCommentRequestId ) {
            return state.reviews.requests[patchCommentRequestId]
        } else {
            return null
        }

    })

    const deleteCommentRequest = useSelector(function(state) {
        if ( deleteCommentRequestId ) {
            return state.reviews.requests[deleteCommentRequestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const commit = function(event) {
        const comment = {
            id: props.comment.id,
            threadId: props.comment.threadId,
            userId: props.comment.userId,
            threadOrder: props.comment.threadOrder,
            status: 'in-progress',
            content: content
        }
        if ( patchCommentRequest ) {
            dispatch(cleanupRequest(patchCommentRequest))
        }
        setPatchCommentRequestId(dispatch(patchReviewComment(props.paper.id, props.review.id, props.comment.threadId, comment)))
    }

    const onSubmit = function(event) {
        event.preventDefault()
        const comment = {
            id: props.comment.id,
            threadId: props.comment.threadId,
            userId: props.comment.userId,
            threadOrder: props.comment.threadOrder, 
            status: 'posted',
            content: content
        }
        if ( patchCommentRequest ) {
            dispatch(cleanupRequest(patchCommentRequest))
        }
        setPatchCommentRequestId(dispatch(patchReviewComment(props.paper.id, props.review.id, props.comment.threadId, comment)))

        return false
    }

    const cancelComment = function(event) {
        event.preventDefault()

        if ( deleteCommentRequest ) {
            dispatch(cleanupRequest(deleteCommentRequest))
        }
        setDeleteCommentRequestId(dispatch(deleteReviewComment(props.paper.id, props.review.id, props.comment.threadId, props.comment)))
    }

    useLayoutEffect(function() {
        setContent(props.comment.content)

    }, [])

    useEffect(function() {

        return function cleanup() {
            if ( patchCommentRequest ) {
                dispatch(cleanupRequest(patchCommentRequest))
            }

            if ( deleteCommentRequest) {
                dispatch(cleanupRequest(deleteCommentRequest))
            }
        }
    }, [] )

    return (
        <section className="comment-form" >
            <form onSubmit={onSubmit}>
                <div className="content">
                <textarea 
                    name="content" 
                    rows="10" 
                    cols="40" 
                    onBlur={commit}
                    onChange={(e) => setContent(e.target.value)} 
                    value={content}
                >
                </textarea>
            </div>
            <div className="controls">
                <button onClick={cancelComment}>Cancel</button>
                <input type="submit" name="submit" value="Add Comment" />
            </div>
            </form>
        </section>
    
    )

}

export default ReviewCommentForm
