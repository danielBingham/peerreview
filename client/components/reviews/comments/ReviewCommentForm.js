import React, { useState, useEffect, useLayoutEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { deleteReviewComment, patchReviewComment, cleanupRequest } from '/state/reviews'

import Spinner from '/components/Spinner'

import './ReviewCommentForm.css'

/**
 *
 */
const ReviewCommentForm = function(props) {
    
    // ======= Render State =========================================
    
    const [content, setContent] = useState('')

    // ======= Request Tracking =====================================
   
    const [patchCommentRequestId, setPatchCommentRequestId] = useState(null)
    const patchCommentRequest = useSelector(function(state) {
        if ( patchCommentRequestId ) {
            return state.reviews.requests[patchCommentRequestId]
        } else {
            return null
        }

    })

    const [deleteCommentRequestId, setDeleteCommentRequestId] = useState(null)
    const deleteCommentRequest = useSelector(function(state) {
        if ( deleteCommentRequestId ) {
            return state.reviews.requests[deleteCommentRequestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const commit = function(event) {
        // Nothing to commit.
        if ( content.trim().length <= 0 ) {
            return
        }

        const comment = {
            id: props.comment.id,
            status: 'in-progress',
            content: content
        }
        setPatchCommentRequestId(dispatch(patchReviewComment(props.paper.id, props.review.id, props.comment.threadId, comment)))
    }

    const onSubmit = function(event) {
        event.preventDefault()
        const comment = {
            id: props.comment.id,
            status: 'posted',
            content: content
        }
        setPatchCommentRequestId(dispatch(patchReviewComment(props.paper.id, props.review.id, props.comment.threadId, comment)))
        return false
    }

    const cancelComment = function(event) {
        event.preventDefault()
        setDeleteCommentRequestId(dispatch(deleteReviewComment(props.paper.id, props.review.id, props.comment.threadId, props.comment)))
    }

    // ======= Effect Handling ======================================

    useLayoutEffect(function() {
        setContent(props.comment.content)
    }, [])

    useEffect(function() {
        if ( patchCommentRequest && patchCommentRequest.state == 'fulfilled' && props.requestThreadReflow) {
            props.requestThreadReflow()
        }
    }, [ patchCommentRequest ])

    useEffect(function() {
        if ( deleteCommentRequest && deleteCommentRequest.state == 'fulfilled' && props.requestThreadReflow) {
            props.requestThreadReflow()
        }
    }, [ deleteCommentRequest ])

    useEffect(function() {
        return function cleanup() {
            if ( patchCommentRequestId ) {
                if ( props.requestThreadReflow ) {
                    props.requestThreadReflow()
                }
                dispatch(cleanupRequest({ requestId: patchCommentRequestId }))
            }
        }
    }, [ patchCommentRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( deleteCommentRequestId) {
                if ( props.requestThreadReflow ) {
                    props.requestThreadReflow()
                }
                dispatch(cleanupRequest({ requestId: deleteCommentRequestId }))
            }
        }
    }, [ deleteCommentRequestId ] )

    // ======= Render ==============================================

    return (
        <section className="comment-form" >
            <form onSubmit={onSubmit}>
                <div className="content">
                    <textarea 
                        name="content" 
                        autoFocus
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
