import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {  newReview, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import Button from '/components/generic/button/Button'

import './StartReviewButton.css'

/**
 * Render a button allowing a private draft to be submitted as a preprint.
 *
 * @param {Object} props    Standard react props object.
 * @param {Object} props.id The id of the draft paper we're rendering controls for.
 */
const StartReviewButton = function({ id }) {

    // ================= Render State =========================================

    // ================= Request Tracking =====================================
   
    const [ postReviewsRequestId, setPostReviewRequestId ] = useState(null)
    const postReviewsRequest = useSelector(function(state) {
        if ( ! postReviewsRequestId ) {
            return null
        } else {
            return state.reviews.requests[postReviewsRequestId]
        }
    })

    // ================= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[id]
    })

    const paperVersionId = useSelector(function(state) {
        return state.paperVersions.mostRecentVersion[id]
    })
   
    const reviewInProgress = useSelector(function(state) {
        if ( ! ( paper.id in state.reviews.inProgress ) ) {
            return null
        } else if ( ! ( paperVersionId in state.reviews.inProgress[paper.id] ) ) {
            return null
        }
        return state.reviews.inProgress[paper.id][paperVersionId]
    })

    const isAuthor = (currentUser && paper.authors.find((a) => a.userId == currentUser.id) ? true : false)
    const isOwner = (currentUser && isAuthor && paper.authors.find((a) => a.userId == currentUser.id).owner ? true : false)

    // ================= User Action Handling  ================================

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const startReview = function(event) {
        if ( ! reviewInProgress ) {
            setPostReviewRequestId(dispatch(newReview(paper.id, paperVersionId, currentUser.id)))

            let urlString = `/paper/${id}/file`
            navigate(urlString)
        }
    }

    // ======= Effect Handling ======================================

    // Request tracker cleanup.
    useEffect(function() {
        return function cleanup() {
            if ( postReviewsRequestId ) {
                dispatch(cleanupReviewRequest({ requestId: postReviewsRequestId }))
            }
        }
    }, [ postReviewsRequestId ])

    // ======= Render ===============================================
    
    if ( ! reviewInProgress && currentUser ) {
        return (
            <Button type={ isAuthor ? "default" : "primary" } onClick={startReview}>Start Review</Button>  
        )
    } else {
        return null
    }
}

export default StartReviewButton
