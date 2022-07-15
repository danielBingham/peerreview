import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import { setSelected, newReview, postReviewThreads, cleanupRequest } from '/state/reviews'

import Spinner from '/components/Spinner'

import ReviewCommentThreadView from '../review/comments/ReviewCommentThreadView'

import './DraftPaperPDFPageView.css'

/**
 * TODO
 * In Database:
 * paper_version.type -- To record what type of document this verison of the paper is.
 *
 *
 */
const DraftPaperPDFPageView = function(props) {
    
    // ======= Render State =========================================
    
    const [ haveRendered, setHaveRendered ] = useState(false)
    const [ rerenderThreadsToggle, setRerenderThreadsToggle ] = useState(false)

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

    // ============ Redux State ===============================================

    // The currently logged in user, a `user` object.
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // The review that is currently in progress.  `review` object or null.
    const reviewInProgress = useSelector(function(state) {
        return state.reviews.inProgress[props.paper.id]
    })

    const threads = useSelector(function(state) {
        if ( state.reviews.selected[props.paper.id] ) {
            return state.reviews.selected[props.paper.id].threads.filter((t) => t.page == props.pageNumber)
        } else {
            if ( state.reviews.list[props.paper.id] ) {
                const reviews = state.reviews.list[props.paper.id].filter((r) => r.version == props.versionNumber)
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

    // ======= Refs =================================================
    
    /**
     * A ref for the <canvas> element that we'll render the PDF page on to
     * using PDF.js.
     */
    const canvasRef = useRef(null) 

    const lastRenderCanvasRectRef = useRef(null)
    
    // ============ Actions and Event Handlers ========================================
    
    const dispatch = useDispatch()


    /**
     * Handle a click event on the page canvas.  If we don't have a review in
     * progress, start one.  Otherwise, start a new thread.
     */
    const handleClick = function(event) {
        event.preventDefault()

        const canvas = document.getElementById(`page-${props.pageNumber}-canvas`)
        const rect = canvas.getBoundingClientRect()

        const thread = {
            page: props.pageNumber,
            pinX: parseInt(event.clientX - rect.left),
            pinY: parseInt(event.clientY - rect.top),
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

    // ============ Effect Handling ===========================================

    /**
     * Once our <canvas> element has rendered in the DOM, we need to render our
     * PDF Page to the canvas using PDF.js.  PDF.js uses callbacks to handle
     * rendering, so we'll need to setup our render callback.  Once that call
     * back is done, we set our haveRendered state property so that the rest of
     * the component understands we've finished rendering.
     */
    useLayoutEffect(function() {
        setHaveRendered(false)
        if ( canvasRef ) {
            props.pdf.getPage(props.pageNumber).then(function(page) {
                const scalingViewport = page.getViewport({ scale: 1 })
                const scale = 900 / scalingViewport.width

                const viewport = page.getViewport({ scale: scale })

                // Support HiDPI-screens.
                var outputScale = window.devicePixelRatio || 1;

                var context = canvasRef.current.getContext('2d');

                canvasRef.current.width = Math.floor(viewport.width * outputScale);
                canvasRef.current.height = Math.floor(viewport.height * outputScale);
                canvasRef.current.style.width = Math.floor(viewport.width) + "px";
                canvasRef.current.style.height =  Math.floor(viewport.height) + "px";


                var transform = outputScale !== 1
                    ? [outputScale, 0, 0, outputScale, 0, 0]
                    : null;

                var renderContext = {
                    canvasContext: context,
                    transform: transform,
                    viewport: viewport
                };
                page.render(renderContext);

                // Let the rest of the component know that we've rendered the
                // page to our canvas.
                 setHaveRendered(true)
            }).catch(function(error) {
                console.error(error)
            })
        }
    }, [ props.pdf ] )

    useLayoutEffect(function() {
        if ( canvasRef.current && lastRenderCanvasRectRef.current ) {
            const rect = canvasRef.current.getBoundingClientRect()
            if ( lastRenderCanvasRectRef.current.top !== rect.top ) {
                setRerenderThreadsToggle( ! rerenderThreadsToggle )
            }
        }
    })

    useEffect(function() {
        if ( newReviewRequest && newReviewRequest.state == 'fulfilled') {
            dispatch(setSelected(reviewInProgress)) 
        }
    }, [ newReviewRequest ])



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

    // ============ Render ====================================================

    let threadViews = [] 
    if (haveRendered && canvasRef.current ) {
        const rect = canvasRef.current.getBoundingClientRect()
        lastRenderCanvasRectRef.current = rect
        
        for( const thread of threads ) {
            const pinPosition = {
                top: parseInt(thread.pinY + rect.top + window.scrollY),
                left: parseInt(thread.pinX + rect.left + window.scrollX)
            }
            const threadPosition = {
                top: parseInt(thread.pinY + rect.top + window.scrollY),
                left: parseInt(rect.left + rect.width + window.scrollX + 10) 
            }
            threadViews.push(
                <ReviewCommentThreadView 
                    key={thread.id} 
                    paper={props.paper} 
                    thread={thread} 
                    pinPosition={pinPosition} 
                    threadPosition={threadPosition} 
                    selected={( props.selectedThread && props.selectedThread.id == thread.id ? true : false )} 
                    selectThread={props.setSelectedThread}
                />
            )
        }
    }

    const canvasId = `page-${props.pageNumber}-canvas`
    const pageId = `page-${props.pageNumber}`
    return (
        <section id={pageId} className="draft-paper-pdf-page" >
            <canvas id={canvasId} ref={canvasRef} onClick={handleClick}></canvas>
            {haveRendered && threadViews}
            { ! haveRendered && <Spinner /> }
        </section>
    )

}

DraftPaperPDFPageView.defaultProps = {
    versionNumber: 1
}

export default DraftPaperPDFPageView 
