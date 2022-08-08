import React, { useState, useEffect, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { postReviewComments, cleanupRequest } from '/state/reviews'

import ReviewCommentForm from './ReviewCommentForm'
import ReviewCommentView from './ReviewCommentView'

import Spinner from '/components/Spinner'
import './ReviewCommentThreadView.css'

const ReviewCommentThreadView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Request Tracking =====================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.reviews.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const review = useSelector(function(state) {
        return state.reviews.dictionary[props.paper.id][props.thread.reviewId]
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const thread = useSelector(function(state) {
        return state.reviews.dictionary[props.paper.id][props.thread.reviewId].threads.find((t) => t.id == props.thread.id)
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

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
        searchParams.set('thread', thread.id)
        setSearchParams(searchParams)
    }

    const threadClicked = function(event) {
        searchParams.set('thread', thread.id)
        setSearchParams(searchParams)
    }


    // ======= Effect Handling ======================================

    // Cleanup our requests.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    useEffect(function() {
        const onBodyClick = function(event) {
            if ( ! event.target.matches('.pin') &&  ! event.target.matches('.comment-thread') 
                && ! event.target.matches('.pin :scope') && ! event.target.matches('.comment-thread :scope') ) 
            {
                searchParams.delete('thread')
                setSearchParams(searchParams)
            } 
        }
        document.body.addEventListener('click', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('click', onBodyClick)
        }
    }, [ searchParams ])

    // ======= Rendering ============================================

    if ( ! thread ) {
        return (null)
    }

    let inProgress = false
    const commentViews = []
    const sortedComments = [ ...thread.comments ]
    sortedComments.sort((a,b) => a.threadOrder - b.threadOrder)
    for ( const comment of sortedComments) {
        if ( comment.status == 'in-progress' && comment.userId == currentUser.id) {
            inProgress = true
            commentViews.push(<ReviewCommentForm key={comment.id} paper={props.paper} review={review} thread={thread} comment={comment} />)
        } else if ( comment.status == 'posted' ) {
            commentViews.push(<ReviewCommentView key={comment.id} paper={props.paper} review={review} thread={thread} comment={comment} />)
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
    const selected = searchParams.get('thread') == thread.id 
    return (
        <div className="comment-thread-outer">
            <div 
                className={( selected ? "pin selected "+props.paper.fields[0].type : "pin "+props.paper.fields[0].type)} 
                onClick={pinClicked} 
                style={ pinPosition }
            >
            </div> 
            <div 
                key={props.thread.id} 
                id={id} 
                onClick={threadClicked} 
                className={( selected ? "comment-thread selected "+props.paper.fields[0].type : "comment-thread "+props.paper.fields[0].type )} 
                style={ threadPosition}
            >
                { commentViews }
                { ! inProgress && <div onClick={newComment} className="reply">Post a reply...</div> }
            </div>
        </div>
    )
}
export default ReviewCommentThreadView
