import React, { useState, useEffect, useLayoutEffect, useRef, useCallback} from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { postReviewThreads, newReview, cleanupRequest } from '/state/reviews'

import { Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

import ReviewCommentThreadPinView from '/components/reviews/comments/ReviewCommentThreadPinView'

import Spinner from '/components/Spinner'

import './PaperPDFPageView.css'

/**
 * Renders a page of a Draft Paper's PDF file.
 *
 * Also handles rendering the pins for any review comments on that page.
 *
 * @param {Object} props    The standard React props object.
 * @param {integer} props.pageNumber    The number of page the we're viewing,
 * used to select it from the PDF object.  1 indexed.
 * @param {number} props.paperId The id of the paper.:w
 * @param {number} props.paperVersionId  The number of the paper's version that
 * we're viewing. 1 index.
 * @param {function} props.onRenderSuccess A callback to call when we've successfully rendered.
 *
 */
const PaperPDFPageView = function(props) {

    const [ searchParams, setSearchParams ] = useSearchParams()
    const selectedReviewId = searchParams.get('review')

    const [ width, setWidth ] = useState(0)
    const [ height, setHeight ] = useState(0)
    const [ loaded, setLoaded ] = useState(false)
    const [ rendered, setRendered ] = useState(false)

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

    const paper = useSelector(function(state) {
        return state.papers.dictionary[props.paperId]
    })

    const reviewInProgress = useSelector(function(state) {
        for(const [id, review] of Object.entries(state.reviews.dictionary)) {
            if ( review.paperId == props.paperId && review.paperVersionId == props.paperVersionId  && review.status == 'in-progress') {
                return review
            }
        }
        return null
    })

    const threads = useSelector(function(state) {
        if ( state.reviews.queries[props.paperId]?.list && ! selectedReviewId) {
            const reviewIds = state.reviews.queries[props.paperId].list.filter((id) => state.reviews.dictionary[id].paperVersionId == props.paperVersionId)
            const results = []
            for (const id of reviewIds ) {
                results.push(...state.reviews.dictionary[id].threads.filter((t) => t.page == props.pageNumber))
            }
            return results
        } else if ( selectedReviewId && selectedReviewId != 'none' ) {
            const results = []
            if ( state.reviews.dictionary[selectedReviewId].paperVersionId == props.paperVersionId ) {
                results.push(...state.reviews.dictionary[selectedReviewId].threads.filter((t) => t.page == props.pageNumber))
            }
            return results
        } else {
            return [] 
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
    const handleClick = useCallback(function(event) {
        if ( ! reviewInProgress ) {
            return
        }

        event.preventDefault()

        if ( canvasRef.current ) {
            const rect = canvasRef.current.getBoundingClientRect()
            const thread = {
                page: props.pageNumber,
                pinX: ((event.clientX - rect.left)/rect.width).toFixed(20),
                pinY: ((event.clientY - rect.top)/rect.height).toFixed(20),
                comments: [{
                    userId: currentUser.id,
                    threadOrder: 1,
                    status: 'in-progress',
                    content: ''
                }]
            }

            thread.reviewId = reviewInProgress.id
            setPostThreadsRequestId(dispatch(postReviewThreads(paper.id, reviewInProgress.id, thread)))
        }
    }, [ props.pageNumber, paper, reviewInProgress, postReviewThreads, setPostThreadsRequestId ])
    
    const whileLoading = useCallback(() => { 
        return (<Spinner local={true} />)
    }, [])


    const onLoadSuccess = useCallback((page) => {
        setWidth(page.width)
        setHeight(page.height)
        setLoaded(true)
    }, [ setWidth, setHeight, setLoaded ])

    const onRenderSuccess = useCallback(() => {
        setRendered(true)
        if ( props.onRenderSuccess ) {
            props.onRenderSuccess()
        }
    }, [ props.onRenderSuccess, setRendered ])

    useEffect(function() {
        if ( postThreadsRequest && postThreadsRequest.state == 'fulfilled') {
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
                    paper={paper}
                    reviewId={thread.reviewId}
                    width={width}
                    height={height}
                />
            )
        }
    }


    return (
        <div 
            id={`paper-pdf-page-${props.pageNumber}`} 
            className="paper-pdf-page"
            onClick={handleClick}
        >
            { threadPins }
            <Page key={`page-${props.pageNumber}`} 
                canvasRef={canvasRef}
                pageNumber={props.pageNumber} 
                loading={whileLoading} 
                width={800} 
                onLoadSuccess={onLoadSuccess}
                onRenderSuccess={onRenderSuccess}
            /> 
        </div>
    )
}

export default PaperPDFPageView 
