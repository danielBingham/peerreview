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
        return state.reviews.dictionary[props.reviewId].threads.find((t) => t.id == props.id)
    })

    const review = useSelector(function(state) {
        return state.reviews.dictionary[props.reviewId]
    })

    // ======= Actions and Event Handling ===========================
    

    const dispatch = useDispatch()

    const newComment = function(event) {
        event.preventDefault()

        const comment = {
            threadId: thread.id,
            userId: currentUser.id,
            threadOrder: thread.comments.length+1,
            status: 'in-progress',
            content: ''
        }
        setRequestId(dispatch(postReviewComments(props.paper.id, review.id, thread.id, comment))) 
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( request && request.state == 'fulfilled' && props.requestThreadReflow) {
            props.requestThreadReflow()
        }
    }, [ request ])

    // Cleanup our requests.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Rendering ============================================

    let inProgress = false

    const commentViews = []
    
    const sortedComments = [ ...thread.comments ]
    sortedComments.sort((a,b) => a.threadOrder - b.threadOrder)

    const focusForm = searchParams.get('thread') == thread.id

    for ( const comment of sortedComments) {
        if ( ( comment.status == 'in-progress' || comment.status == 'edit-in-progress' ) && comment.userId == currentUser.id) {
            inProgress = true
            commentViews.push(
                <ReviewCommentForm 
                    key={comment.id} 
                    paper={props.paper} 
                    review={review} 
                    thread={thread} 
                    comment={comment} 
                    focusForm={focusForm}
                    requestThreadReflow={props.requestThreadReflow} 
                />
            )
        } else if ( comment.status == 'posted' ) {
            commentViews.push(
                <ReviewCommentView 
                    key={comment.id} 
                    paper={props.paper} 
                    review={review} 
                    thread={thread} 
                    comment={comment} 
                />
            )
        }
    }

    const selected = searchParams.get('thread') == thread.id 
    return (
        <div  className="comment-thread-outer">
            <div key={thread.id} id={`comment-thread-${thread.id}`} className="comment-thread" >
                { commentViews }
                { ! inProgress &&  <div className="reply"><a href="" onClick={newComment}>Post a reply...</a></div> }
            </div>
        </div>
    )
}

export default ReviewCommentThreadView
