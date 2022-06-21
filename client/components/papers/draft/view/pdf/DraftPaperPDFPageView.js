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
    /**
     * Record whether we've rendered the PDF page to our <canvas> element yet.
     *
     * `true` if we've rendered the page to canvas, `false` otherwise.
     *
     * @type {boolean}
     */
    const [ haveRendered, setHaveRendered ] = useState(false)

    /**
     * An array of `ReviewCommentThreadView` components to render our threads.
     *
     * @type {ReviewCommentThreadView[]}
     */
    const [ threadViews, setThreadViews ] = useState([])

    const [ selectedThread, setSelectedThread ] = useState(null)

    /**
     * A RequestTracker to track our POST /.../threads request.
     *
     * @type {RequestTracker}
     */
    const [ postThreadsRequestId, setPostThreadsRequestId ] = useState(null)

    /**
     * A RequestTracker to track our POST /.../reviews request.
     *
     * @type {RequestTracker}
     */
    const [ newReviewRequestId, setNewReviewRequestId ] = useState(null)

    /**
     * A ref for the <canvas> element that we'll render the PDF page on to
     * using PDF.js.
     */
    const canvasRef = useRef(null) 

    // ============ React/Redux helpers =======================================

    const dispatch = useDispatch()

    // ============ Request Tracking ==========================================

    /**
     * The tracker for the POST /paper/:paper_id/review/:review_id/threads
     * request.
     *
     * A request tracker object.
     *
     * @type {object} 
     */
    const postThreadsRequest = useSelector(function(state) {
        if ( ! postThreadsRequestId ) {
            return null
        } else {
            return state.reviews.requests[postThreadsRequestId]
        }
    })

    /**
     * The tracker for the POST /paper/:paper_id/reviews request that will
     * create a new review for us.
     *
     * A request tracker object.
     *
     * @type {object}
     */
    const newReviewRequest = useSelector(function(state) {
        if ( ! newReviewRequestId ) {
            return null
        } else {
            return state.reviews.requests[newReviewRequestId]
        }
    })

    // ============ Redux State ===============================================

    /**
     * The user currently logged in.  This is who will be potentially creating
     * new threads (or a new review).
     *
     * A user object.
     *
     * @type {object} 
     */
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    /**
     * The review that is curently in progress on this draft (if any).
     *
     * A review object.
     *
     * @type {object} 
     */
    const reviewInProgress = useSelector(function(state) {
        return state.reviews.inProgress[props.paper.id]
    })

    /**
     * The review that is currently selected for viewing.  We only want to
     * display threads belonging to this review.
     *
     * @type {object} A review object.
     */
    const selectedReview = useSelector(function(state) {
        return state.reviews.selected[props.paper.id]
    })

    const reviewTargets = useSelector(function(state) {
        if ( state.reviews.selected[props.paper.id] ) {
            return state.reviews.selected[props.paper.id]
        } else {
            return state.reviews.list[props.paper.id]
        }
    })

    /**
     * An array of threads that are attached to this page.
     *
     * @type {object[]} A list of threads that are pinned to this page.
     */
    const threads = useSelector(function(state) {
        if ( state.reviews.selected[props.paper.id] ) {
            return state.reviews.selected[props.paper.id].threads.filter((t) => t.page == props.pageNumber)
        } else {
            const reviews = state.reviews.list[props.paper.id]
            const results = []
            if ( reviews ) {
                for (const review of reviews ) {
                    results.push(...review.threads.filter((t) => t.page == props.pageNumber))
                }
            }
            return results
        }
    })

    // ============ Method definitions ========================================
    //
    const selectThread = function(thread) {
        console.log('Selecting thread:')
        console.log(thread)
        setSelectedThread(thread)
    }

    /**
     * Create the `ReviewCommentThreadView` components for each of the threads
     * we just pulled from the store above.  
     *
     * This will create the thread views and set them on our `threadViews`
     * state property.
     *
     * NOTE: We need to do this in a method because we can't do it in the
     * initial render.  This code depends on the <canvas> element being
     * rendered and positioned in the DOM and it won't be during React's normal
     * render cycle, even if we have a ref to it.  So we have to wait until
     * after the render cycle by running this in an useEffect.  However, we
     * want to run this in response to multiple potential events, hence,
     * multiple useEffects.
     *
     * @returns undefined
     */
    const createThreadViews = function() {
        const newThreadViews = []
        const rect = canvasRef.current.getBoundingClientRect()
        
        for( const thread of threads ) {
            const pinPosition = {
                top: parseInt(thread.pinY + rect.top + window.scrollY),
                left: parseInt(thread.pinX + rect.left + window.scrollX)
            }
            const threadPosition = {
                top: parseInt(thread.pinY + rect.top + window.scrollY),
                left: parseInt(rect.left + rect.width + window.scrollX + 10) 
            }
            newThreadViews.push(
                <ReviewCommentThreadView 
                    key={thread.id} 
                    paper={props.paper} 
                    thread={thread} 
                    pinPosition={pinPosition} 
                    threadPosition={threadPosition} 
                    selected={( selectedThread && selectedThread.id == thread.id ? true : false )} 
                    selectThread={selectThread}
                />
            )
        }
        setThreadViews(newThreadViews)
    }


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
            setNewReviewRequestId(dispatch(newReview(props.paper.id, currentUser.id, [thread])))
        }
    }

    // ============ Layout Effect Handling ====================================

    /**
     * Once our <canvas> element has rendered in the DOM, we need to render our
     * PDF Page to the canvas using PDF.js.  PDF.js uses callbacks to handle
     * rendering, so we'll need to setup our render callback.  Once that call
     * back is done, we set our haveRendered state property so that the rest of
     * the component understands we've finished rendering.
     */
    useLayoutEffect(function() {
        if ( canvasRef ) {
            props.pdf.getPage(props.pageNumber).then(function(page) {
                var scale = 1.5;
                var viewport = page.getViewport({ scale: scale, });
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
    }, [ ] )

    // ============ Effect Handling ===========================================
    //

    /**
     * Our initial render of the threadViews, after the canvas has loaded in
     * the DOM and we've successfully rendered the page to it (meaning it has
     * its final size and position).
     */
    useEffect(function() {
        if ( haveRendered ) {
            createThreadViews()
        }
    }, [ haveRendered ] )

    /**
     * Cleanup our last postThreadsRequest.
     */
     useEffect(function() {

        return function cleanup() {
            if ( postThreadsRequest ) {
                dispatch(cleanupRequest(postThreadsRequest))
            }
        }
    }, [ ])

    useEffect(function() {
        if ( newReviewRequest && newReviewRequest.state == 'fulfilled') {
            dispatch(setSelected(reviewInProgress)) 
        }

        return function cleanup() {
            if ( newReviewRequest ) {
                dispatch(cleanupRequest(newReviewRequest))
            }
        }
    }, [ newReviewRequest ])

    /**
     * If the parent reviews of any of the threads we're rendering have
     * changed, then we need to re-render the threads.
     *
     * This may result in us executing some extra renders, because there will
     * be reviews in this list with no threads on this page.  But better extra
     * renders than not rendering when we need to.
     */
    useEffect(function() {
        if ( haveRendered ) {
            createThreadViews()
        }
    }, [ reviewTargets ])

    useEffect(function() {
        if ( haveRendered ) {
            createThreadViews()
        }
    }, [ selectedThread ])

    // ============ Render ====================================================
    
    const canvasId = `page-${props.pageNumber}-canvas`
    const pageId = `page-${props.pageNumber}`
    return (
        <section id={pageId} className="draft-paper-pdf-page">
            <canvas id={canvasId} ref={canvasRef} onClick={handleClick} style={ haveRendered ? { display: 'block' } : { display: 'none' } }></canvas>
            {threadViews}
            { ! haveRendered && <Spinner /> }
        </section>
    )

}

export default DraftPaperPDFPageView 
