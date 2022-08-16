import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

import { deleteReviewComment, patchReviewComment, cleanupRequest } from '/state/reviews'

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

    const dispatch = useDispatch()

    const goToReview = function(event) {
        event.preventDefault()
        event.stopPropagation()
        searchParams.set('review', props.review.id)
        searchParams.set('thread', props.thread.id)
        setSearchParams(searchParams)
    }

    const goToComment = function(event) {
        event.preventDefault()
        event.stopPropagation()
        searchParams.set('thread', props.thread.id)
        setSearchParams(searchParams)
    }

    const edit = function(event) {
        event.preventDefault()
        event.stopPropagation()
        
        if ( props.review.status !== 'in-progress') {
            return
        }

        const comment = {
            id: props.comment.id,
            threadId: props.comment.threadId,
            userId: props.comment.userId,
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
            <div key={props.comment.id} id={props.comment.id} className="comment-outer">
                <div className="profile-picture"></div>
                <UserTag id={props.comment.userId} />
                { props.review.status == 'in-progress' && (<span className="controls"><span onClick={edit} className="edit link">edit</span> <span onClick={(e) => setAreYouSure(true)} className="delete link">delete</span></span>) }
                <div className="datetime">posted <a onClick={goToComment} href={`?review=${props.review.id}&thread=${props.thread.id}`}><DateTag timestamp={props.comment.updatedDate} /></a> in <a onClick={goToReview} href={`?review=${props.review.id}&thread=${props.thread.id}`}>review #{props.review.id}</a></div>
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
