import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { newPaperComment, updatePaperComment, deletePaperComment, cleanupRequest } from '/state/paperComments'

import Button from '/components/generic/button/Button'

import './PaperCommentForm.css'

const PaperCommentForm = function({ paperId }) {

    console.log(`\n\n ## PaperCommentForm(${paperId}) ##`)
    
    // ======= Render State =========================================
   
    const [ commentId, setCommentId ] = useState(null)
    const [content, setContent] = useState('')
    const [ needCommit, setNeedCommit ] = useState(false)

    console.log(`CommentId: ${commentId}`)
    console.log(`Content: ${content}`)
    console.log(`NeedCommit: ${needCommit}`)

    // ======= Request Tracking =====================================
  
    const [postCommentRequestId, setPostCommentRequestId] = useState(null)
    const postCommentRequest = useSelector(function(state) {
        if ( postCommentRequestId ) {
            return state.paperComments.requests[postCommentRequestId]
        } else {
            return null
        }
    })

    const [patchCommentRequestId, setPatchCommentRequestId] = useState(null)
    const patchCommentRequest = useSelector(function(state) {
        if ( patchCommentRequestId ) {
            return state.paperComments.requests[patchCommentRequestId]
        } else {
            return null
        }

    })

    const [deleteCommentRequestId, setDeleteCommentRequestId] = useState(null)
    const deleteCommentRequest = useSelector(function(state) {
        if ( deleteCommentRequestId ) {
            return state.paperComments.requests[deleteCommentRequestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paperComment = useSelector(function(state) {
        if ( commentId ) {
            return state.paperComments.dictionary[commentId]
        } else {
            return null
        }
    })
    console.log(`PaperComment: `)
    console.log(paperComment)

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()
    
    const commitComment = function() {
        const comment = {
            id: commentId,
            status: status,
            content: content
        }
        setPatchCommentRequestId(dispatch(updatePaperComment(comment)))
    }

    const create = function(event) {
        setPostCommentRequestId(dispatch(newPaperComment(paperId, currentUser.id)))
    }

    const commit = function(event) {
        // Nothing to commit.
        if ( content.trim().length <= 0 ) {
            setDeleteCommentRequestId(dispatch(deletePaperComment(commentId)))
            setCommentId(null)
        } else {

            if ( ! commentId ) {
                setNeedCommit(true)
            } else {
                commitComment()
            }
        }
    }

    const submitComment = function(event) {
        event.preventDefault()

        const comment = {
            id: commentId,
            status: 'committed',
            content: content
        }
        setPatchCommentRequestId(dispatch(updatePaperComment(comment)))
        return false
    }

    const cancelComment = function(event) {
        event.preventDefault()
        
        if ( status == 'in-progress') {
            setDeleteCommentRequestId(dispatch(deleteReviewComment(props.paper.id, props.review.id, props.comment.threadId, props.comment)))
        } else if ( status == 'edit-in-progress' ) {
            const comment = {
                id: commentId,
                status: 'reverted'
            }
            setPatchCommentRequestId(dispatch(patchReviewComment(props.paper.id, props.review.id, props.comment.threadId, comment)))
        }

    }

    // ======= Effect Handling ======================================


    useEffect(function() {
        if ( postCommentRequest && postCommentRequest.state == 'fulfilled' && ! postCommentRequest.cacheBusted) {
            console.log(`Setting comment id: `)
            console.log(postCommentRequest)
            setCommentId(postCommentRequest.result.entity.id)
            if ( needCommit ) {
                commitComment()
                setNeedCommit(false)
            }
        }
    }, [ postCommentRequest ])

    useEffect(function() {
        return function cleanup() {
            if ( postCommentRequestId ) {
                dispatch(cleanupRequest({ requestId: postCommentRequestId }))
            }
        }
    }, [ postCommentRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( patchCommentRequestId ) {
                dispatch(cleanupRequest({ requestId: patchCommentRequestId }))
            }
        }
    }, [ patchCommentRequestId ])

    useEffect(function() {
        return function cleanup() {
            if ( deleteCommentRequestId) {
                dispatch(cleanupRequest({ requestId: deleteCommentRequestId }))
            }
        }
    }, [ deleteCommentRequestId ] )

    // ======= Render ==============================================

    return (
        <div className="paper-comment-form" >
            <div className="content">
                <textarea 
                    name="content" 
                    onFocus={create}
                    onBlur={commit}
                    onChange={(e) => setContent(e.target.value)} 
                    value={content}
                    placeholder="Write a comment..."
                >
                </textarea>
            </div>
            <div className="controls">
                <Button onClick={cancelComment}>Cancel</Button>
                <Button type="primary" onClick={submitComment}>{ paperComment && paperComment.status == 'edit-in-progress' ? 'Edit' : 'Add Comment'}</Button>
            </div>
        </div>
    )

}

export default PaperCommentForm
