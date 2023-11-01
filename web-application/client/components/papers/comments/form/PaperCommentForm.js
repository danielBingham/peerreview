import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { newPaperComment, updatePaperComment, deletePaperComment, cleanupRequest } from '/state/paperComments'

import Button from '/components/generic/button/Button'

import VisibilityControl from '/components/papers/view/timeline/events/controls/VisibilityControl'
import VisibilityBar from '/components/papers/view/timeline/events/controls/VisibilityBar'

import './PaperCommentForm.css'

const PaperCommentForm = function({ paperId, paperCommentId }) {
    
    // ======= Render State =========================================
   
    const [commentId, setCommentId] = useState(null)
    const [content, setContent] = useState('')
    const [needCommit, setNeedCommit] = useState(false)

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
        if ( paperCommentId && ! commentId ) {
            const comment = state.paperComments.dictionary[paperCommentId]
            if ( comment.status !== 'edit-in-progress' ) {
                throw new Error(`PaperCommentForm() called with comment not in 'edit-in-progress'.`)
            }
            return comment
        } else if ( commentId ) {
            return state.paperComments.dictionary[commentId]
        } else {
            // Otherwise, look for a comment in progress and use that.
            for( const [ id, comment] of Object.entries(state.paperComments.dictionary)) {
                if ( comment.userId == currentUser?.id && comment.paperId == paperId && comment.status == 'in-progress' ) {
                    return comment
                }
            }
            return null
        }
    })

    const event = useSelector(function(state) {
        if ( ! paperComment ) {
            return null
        }
        for(const [id, event] of Object.entries(state.paperEvents.dictionary)) {
            if ( event.paperCommentId == paperComment.id ) {
                return event
            }
        }
        return null
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()
    
    const commitComment = function() {
        const comment = {
            id: commentId,
            content: content
        }
        setPatchCommentRequestId(dispatch(updatePaperComment(comment)))
    }

    const create = function(event) {
        if ( ! commentId && ! paperComment ) {
            setPostCommentRequestId(dispatch(newPaperComment(paperId, currentUser.id)))
        }
    }

    const commit = function(event) {
        // Nothing to commit.
        if ( ! commentId ) {
            setNeedCommit(true)
        } else {
            commitComment()
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

        setCommentId(null)
        setContent('')
        return false
    }

    const cancelComment = function(event) {
        event.preventDefault()
       
        if ( paperComment.status == 'in-progress') {
            setDeleteCommentRequestId(dispatch(deletePaperComment(commentId)))
        } else if ( paperComment.status == 'edit-in-progress' ) {
            const comment = {
                id: commentId,
                status: 'reverted'
            }
            setPatchCommentRequestId(dispatch(updatePaperComment(comment)))
        }
        setCommentId(null)
        setContent('')
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( paperComment && ! commentId ) {
            setCommentId(paperComment.id)
            setContent(paperComment.content)
        }
    }, [ paperComment ])

    useEffect(function() {
        if ( postCommentRequest && postCommentRequest.state == 'fulfilled' && ! postCommentRequest.cacheBusted) {
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
            <VisibilityBar eventId={event?.id} />
            <div className="controls">
                <Button onClick={cancelComment}>Cancel</Button>
                <Button type="primary" onClick={submitComment}>{ paperComment && paperComment.status == 'edit-in-progress' ? 'Edit' : 'Add Comment'}</Button>
            </div>
        </div>
    )

}

export default PaperCommentForm
