import React, { useState, useEffect, useLayoutEffect, useRef, useCallback} from 'react'

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

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // We need the thread to update based on changes to the redux store. For
    // some reason, even though we pull it from the redux store in
    // DraftPaperPDFView, that's not triggering the ThreadView to re-render
    // appropriately.  This does.
    const thread = useSelector(function(state) {
        return state.reviews.dictionary[props.paper.id][props.reviewId].threads.find((t) => t.id == props.id)
    })

    const review = useSelector(function(state) {
        return state.reviews.dictionary[props.paper.id][thread.reviewId]
    })

    const threadRef = useRef(null)

    // ======= Actions and Event Handling ===========================
    

    const dispatch = useDispatch()

    const newComment = function(event) {
        const comment = {
            threadId: thread.id,
            userId: currentUser.id,
            threadOrder: thread.comments.length+1,
            status: 'in-progress',
            content: ''
        }
        setRequestId(dispatch(postReviewComments(props.paper.id, review.id, thread.id, comment))) 
    }

    const threadClicked = function(event) {
        searchParams.set('thread', thread.id)
        setSearchParams(searchParams)
        if ( threadRef.current ) {
            threadRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            })
        }
    }


    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( searchParams.get('thread') == thread.id && threadRef.current ) {
            threadRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            })
        }
    }, [ searchParams ])

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
            if ( ! event.target.matches('.comment-thread-pin') &&  ! event.target.matches('.comment-thread') 
                && ! event.target.matches('.comment-thread-pin :scope') && ! event.target.matches('.comment-thread :scope') ) 
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

    let inProgress = false
    const viewOnly = ! props.paper.isDraft
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

    const selected = searchParams.get('thread') == thread.id 
    return (
        <div  ref={threadRef} className="comment-thread-outer">
            <div 
                key={thread.id} 
                id={`comment-thread-${thread.id}`} 
                onClick={threadClicked} 
                className={( selected ? "comment-thread selected "+props.paper.fields[0].type : "comment-thread "+props.paper.fields[0].type )} 
            >
                { commentViews }
                { ! inProgress && ! viewOnly && <div onClick={newComment} className="reply">Post a reply...</div> }
            </div>
        </div>
    )
}

export default ReviewCommentThreadView
