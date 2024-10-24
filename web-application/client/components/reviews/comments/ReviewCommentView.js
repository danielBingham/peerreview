import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'

import { deleteReviewComment, patchReviewComment, cleanupRequest } from '/state/reviews'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import UserTag from '/components/users/UserTag'
import DateTag from '/components/DateTag'
import Spinner from '/components/Spinner'
import AreYouSure from '/components/AreYouSure'

import './ReviewCommentView.css'

const ReviewCommentView = function(props) {

    const [ searchParams, setSearchParams ] = useSearchParams()

    const [ areYouSure, setAreYouSure ] = useState(false)

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

    const hasReviewCommentVersions171 = useSelector(function(state) {
        return state.system.features['review-comment-versions-171'] && state.system.features['review-comment-versions-171'].status == 'enabled'
    })

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch()

    const edit = function(event) {
        event.preventDefault()
        
        if ( props.review.status !== 'in-progress') {
            return
        }

        const comment = {
            id: props.comment.id,
            status: ( hasReviewCommentVersions171 ? 'edit-in-progress' : 'in-progress' )
        }
        
        setPatchCommentRequestId(dispatch(patchReviewComment(props.paper.id, props.review.id, props.comment.threadId, comment)))
    }

    const deleteComment = function(event) {
        event.preventDefault()
        event.stopPropagation()

        setDeleteCommentRequestId(dispatch(deleteReviewComment(props.paper.id, props.review.id, props.comment.threadId, props.comment)))
    }

    // ======= Effect Handling ======================================

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

    // ======= Render ===============================================

    return (
        <>
            <AreYouSure 
                isVisible={areYouSure} 
                action="delete this comment" 
                execute={deleteComment} 
                cancel={() => setAreYouSure(false)} 
            /> 
            <div key={props.comment.id} id={`review-comment-${props.comment.id}`} className="comment-outer">
                { props.review.status == 'in-progress' && (
                    <FloatingMenu className="controls">
                        <FloatingMenuTrigger showArrow={false}><EllipsisHorizontalIcon /></FloatingMenuTrigger>
                        <FloatingMenuBody>
                            <FloatingMenuItem onClick={edit} className="edit">edit</FloatingMenuItem> 
                            <FloatingMenuItem onClick={(e) => setAreYouSure(true)} className="delete">delete</FloatingMenuItem>
                        </FloatingMenuBody>
                    </FloatingMenu>
                ) }
                <div className="header">
                    <UserTag id={props.comment.userId} />
                    <span className="datetime"> { props.comment.version > 1 ? 'editted' : 'posted' } <a href={`#review-comment-${props.comment.id}`}><DateTag timestamp={props.comment.updatedDate} type="full"/></a> in <a  href={`#review-${props.review.id}`}>review #{props.review.id}</a></span>
                </div>
                <div className="comment-inner" style={{ padding: '5px' }} >
                    <ReactMarkdown>
                        {props.comment.content}
                    </ReactMarkdown>
                </div>
            </div>
        </>
    )
}
export default ReviewCommentView
