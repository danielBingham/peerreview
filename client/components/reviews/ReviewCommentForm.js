import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { postReviews, postReviewComments, cleanupRequest } from '../../state/reviews'

import Spinner from '../Spinner'

const ReviewCommentForm = function(props) {
    const [postReviewsRequestId, setPostReviewsRequestId] = useState(null)
    const [postCommentsRequestId, setPostCommentsRequestId] = useState(null)

    const [content, setContent] = useState('')

    const dispatch = useDispatch()

    const { paperId } = useParams()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const reviewInProgress = useSelector(function(state) {
        return state.reviews.list.find((review) => review.userId == currentUser.id && review.paperId == paperId)
    })

    const postReviewsRequest = useSelector(function(state) {
        if ( postReviewsRequestId ) {
            return state.reviews.requests[postReviewsRequestId]
        } else {
            return null
        }
    })

    const postCommentsRequest = useSelector(function(state) {
        if ( postCommentsRequestId ) {
            return state.reviews.requests[postCommentsRequestId]
        } else {
            return null
        }

    })

    const onContentChange = function(event) {
        event.preventDefault()
        setContent(event.target.value)
    }

    const onSubmit = function(event) {
        event.preventDefault()
        const comment = {
            parentId: props.parentId,
            page: props.pageNumber,
            pinX: props.x,
            pinY: props.y,
            content: content,
        }

        if ( ! reviewInProgress ) {
            const review = {
                paperId: paperId,
                userId: currentUser.id,
                summary: '',
                status: 'in-progress',
                comments: [comment]
            }
            setPostReviewsRequestId(dispatch(postReviews(review)))
        } else {
            setPostCommentsRequestId(dispatch(postReviewComments(reviewInProgress.paperId, reviewInProgress.id, comment)))
        }

        return false
    }

    useEffect(function() {
        if ( postReviewsRequest && postReviewsRequest.state == 'fulfilled') {
           props.close() 
        }

        if ( postCommentsRequest && postCommentsRequest.state == 'fulfilled') {
            props.close()
        }

        return function cleanup() {
            if ( postReviewsRequest ) {
                dispatch(cleanupRequest(postReviewsRequestId))
            }

            if ( postCommentsRequest ) {
                dispatch(cleanupRequest(postCommentsRequestId))
            }
        }
    })

    const style = { 
        background: 'white',
        border: 'thin solid black',
        position: 'absolute',
        top: props.y + 'px',
        left: props.x + 'px'
    }

    return (
        <section className="commentForm" style={ style } >
            <form onSubmit={onSubmit}>
                <textarea name="content" rows="10" columns="80" onChange={onContentChange} value={content}></textarea>
                <input type="submit" name="submit" value={ ( reviewInProgress ? "Add Comment" : "Start Review" ) } />
            </form>
        </section>
    
    )

}

export default ReviewCommentForm