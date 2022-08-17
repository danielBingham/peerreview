import React, { useState, useEffect, useLayoutEffect, useRef, useCallback} from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { postReviewThreads, newReview, cleanupRequest } from '/state/reviews'

import { Page } from 'react-pdf/dist/esm/entry.webpack'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

import ReviewCommentThreadPinView from '../review/comments/ReviewCommentThreadPinView'

import Spinner from '/components/Spinner'

import './DraftPaperPDFPageView.css'

/**
 * Renders a page of a Draft Paper's PDF file.
 *
 * Also handles rendering the pins for any review comments on that page.
 *
 * @param {Object} props    The standard React props object.
 * @param {integer} props.pageNumber    The number of page the we're viewing,
 * used to select it from the PDF object.  1 indexed.
 * @param {Object} props.paper  The populated paper object of the paper we're
 * viewing.
 * @param {Object} props.versionNumber  The number of the paper's version that
 * we're viewing. 1 index.
 *
 */
const DraftPaperPDFPageView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()
    const [ width, setWidth ] = useState(0)
    const [ height, setHeight ] = useState(0)
    const [ loaded, setLoaded ] = useState(false)

    // ============ Request Tracking ==========================================

    const [ postThreadsRequestId, setPostThreadsRequestId ] = useState(null)
    const postThreadsRequest = useSelector(function(state) {
        if ( ! postThreadsRequestId ) {
            return null
        } else {
            return state.reviews.requests[postThreadsRequestId]
        }
    })

    const [ newReviewRequestId, setNewReviewRequestId ] = useState(null)
    const newReviewRequest = useSelector(function(state) {
        if ( ! newReviewRequestId ) {
            return null
        } else {
            return state.reviews.requests[newReviewRequestId]
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const reviewInProgress = useSelector(function(state) {
        if ( ! state.reviews.inProgress[props.paper.id] ) {
            return null
        } else if ( ! state.reviews.inProgress[props.paper.id][props.versionNumber] ) {
            return null
        }
        return state.reviews.inProgress[props.paper.id][props.versionNumber]
    })

    const selectedReview = searchParams.get('review')
    const threads = useSelector(function(state) {
        if ( selectedReview && selectedReview !== 'all' && state.reviews.dictionary[props.paper.id] && state.reviews.dictionary[props.paper.id][selectedReview]) {
            return state.reviews.dictionary[props.paper.id][selectedReview].threads.filter((t) => t.page == props.pageNumber)
        } else if ( ! selectedReview ) {
            return []
        } else {
            if ( state.reviews.list[props.paper.id] ) {
                const reviews = state.reviews.list[props.paper.id][props.versionNumber]
                const results = []
                if ( reviews && reviews.length > 0 ) {
                    for (const review of reviews ) {
                        results.push(...review.threads.filter((t) => t.page == props.pageNumber))
                    }
                }
                return results
            } else {
                return [] 
            }
        }
    })

    // ======= Refs ================================================

    const canvasRef = useRef(null)

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch()

    /**
     * Handle a click event on the page canvas.  If we don't have a review in
     * progress, start one.  Otherwise, start a new thread.
     */
    const handleClick = function(event, pageNumber) {
        event.preventDefault()

        if ( canvasRef.current ) {
            const rect = canvasRef.current.getBoundingClientRect()
            const thread = {
                page: pageNumber,
                pinX: ((event.clientX - rect.left)/rect.width).toFixed(20),
                pinY: ((event.clientY - rect.top)/rect.height).toFixed(20),
                comments: [{
                    userId: currentUser.id,
                    threadOrder: 1,
                    status: 'in-progress',
                    content: ''
                }]
            }
            if ( reviewInProgress )  {
                thread.reviewId = reviewInProgress.id
                setPostThreadsRequestId(dispatch(postReviewThreads(props.paper.id, reviewInProgress.id, thread)))
            } else {
                setNewReviewRequestId(dispatch(newReview(props.paper.id, props.versionNumber, currentUser.id, [thread])))
            }
        }
    }

    useEffect(function() {
        if ( newReviewRequest && newReviewRequest.state == 'fulfilled') {
            searchParams.set('review', reviewInProgress.id)
            setSearchParams(searchParams)
        }
    }, [ newReviewRequest ])

    useEffect(function() {
        if ( postThreadsRequest && postThreadsRequest.state == 'fulfilled') {
            searchParams.set('review', reviewInProgress.id)
            if ( postThreadsRequest.result.threadIds.length == 1) {
                searchParams.set('thread', postThreadsRequest.result.threadIds[0])
            }
            setSearchParams(searchParams)
        }
    }, [ postThreadsRequest ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( postThreadsRequestId) {
                dispatch(cleanupRequest({ requestId: postThreadsRequestId}))
            }
        }
    }, [ postThreadsRequestId])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( newReviewRequestId) {
                dispatch(cleanupRequest({ requestId: newReviewRequestId}))
            }
        }
    }, [ newReviewRequestId ])

    const threadPins = []
    if ( loaded ) {
        for(const thread of threads) {
            threadPins.push(
                <ReviewCommentThreadPinView
                    key={thread.id}
                    id={thread.id}
                    paper={props.paper}
                    reviewId={thread.reviewId}
                    width={width}
                    height={height}
                />
            )
        }
    }


    return (
        <div className="draft-paper-pdf-page">
            { threadPins }
            <Page key={`page-${props.pageNumber}`} 
                canvasRef={canvasRef}
                pageNumber={props.pageNumber} 
                loading={<Spinner local={true} />} 
                width={780} 
                onClick={(e) => handleClick(e, props.pageNumber)}
                onLoadSuccess={(page) => {
                    setWidth(page.width)
                    setHeight(page.height)
                    setLoaded(true)
                }}
            /> 
        </div>
    )
}

export default DraftPaperPDFPageView 
