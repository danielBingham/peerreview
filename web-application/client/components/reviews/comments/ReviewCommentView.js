import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

import { deleteReviewComment, patchReviewComment, cleanupRequest } from '/state/reviews'

import UserTag from '/components/users/UserTag'
import DateTag from '/components/DateTag'
import Spinner from '/components/Spinner'
import AreYouSure from '/components/AreYouSure'

import { XCircleIcon } from '@heroicons/react/24/outline'

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

    const dispatch = useDispatch()

    const edit = function(event) {
        event.preventDefault()
        event.stopPropagation()
        
        if ( props.review.status !== 'in-progress') {
            return
        }

        const comment = {
            id: props.comment.id,
            status: 'in-progress'
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
            <div key={props.comment.id} id={`comment-${props.comment.id}`} className="comment-outer">
                { props.review.status == 'in-progress' && (
                    <span className="controls">
                        <a href={`?thread=${props.thread.id}`} onClick={edit} className="edit">edit</a> 
                        <span onClick={(e) => setAreYouSure(true)} className="delete"><XCircleIcon /></span>
                    </span>
                ) }
                <UserTag id={props.comment.userId} />
                <div className="datetime">posted <a href={`#comment-${props.comment.id}`}><DateTag timestamp={props.comment.updatedDate} /></a> in <a  href={`#review-${props.review.id}`}>review #{props.review.id}</a></div>
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
