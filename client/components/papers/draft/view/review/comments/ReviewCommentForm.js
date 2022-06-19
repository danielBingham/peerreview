import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { patchReviewComment, cleanupRequest } from '/state/reviews'

import Spinner from '/components/Spinner'

const ReviewCommentForm = function(props) {
    const [patchCommentRequestId, setPatchCommentRequestId] = useState(null)

    const [content, setContent] = useState('')

    const dispatch = useDispatch()


    const patchCommentRequest = useSelector(function(state) {
        if ( patchCommentRequestId ) {
            return state.reviews.requests[patchCommentRequestId]
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
        setPatchCommentRequestId(dispatch(patchReviewComment(props.paper.id, props.review.id, props.comment.threadId, comment)))

        return false
    }

    useLayoutEffect(function() {
        setContent(props.comment.content)

    }, [])

    useEffect(function() {

        return function cleanup() {
            if ( patchCommentRequest ) {
                dispatch(cleanupRequest(patchCommentRequest))
            }
        }
    }, [] )

    return (
        <section className="comment-form" >
            <form onSubmit={onSubmit}>
                <textarea 
                    name="content" 
                    rows="10" 
                    cols="40" 
                    onBlur={commit}
                    onChange={(e) => setContent(e.target.value)} 
                    value={content}
                >
                </textarea>
                <input type="submit" name="submit" value="Add Comment" />
            </form>
        </section>
    
    )

}

export default ReviewCommentForm
