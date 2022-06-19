import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import { postReviewThreads, cleanupRequest } from '/state/reviews'

import Spinner from '/components/Spinner'

import ReviewCommentThreadView from '../review/comments/ReviewCommentThreadView'

import './DraftPaperPDFPageView.css'

/**
 * TODO
 * ReviewCommentThreadView (thread wrapper)
 * ReviewCommentView (for each comment)
 * ReviewCommentThreadReplyForm (for thread replies)
 * DraftPaperPageView -- A wrapper for the page independent of page type.
 * Renders most of the comments.
 *
 * In Database:
 * review_comment_pdf_pin -- To track the pin on PDF documents.
 * paper_version.type -- To record what type of document this verison of the paper is.
 *
 *
 */
const DraftPaperPDFPageView = function(props) {
    const [ haveRendered, setHaveRendered ] = useState(false)
    const [ threadViews, setThreadViews ] = useState([])

    const [ postThreadsRequestId, setPostThreadsRequestId ] = useState(null)

    const canvasRef = useRef(null) 
    
    const dispatch = useDispatch()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const postThreadsRequest = useSelector(function(state) {
        if ( ! postThreadsRequestId ) {
            return null
        } else {
            return state.reviews.requests[postThreadsRequestId]
        }
    })

    const reviewInProgress = useSelector(function(state) {
        return state.reviews.inProgress[props.paper.id]
    })

    const selectedReview = useSelector(function(state) {
        return state.reviews.selected[props.paper.id]
    })

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

    const createThreadViews = function() {
        const newThreadViews = []
        const rect = canvasRef.current.getBoundingClientRect()
        
        for( const thread of threads ) {
            const position = {
                top: parseInt(thread.pinY + rect.top + window.scrollY),
                left: parseInt(thread.pinX + rect.left + window.scrollX)
            }
            newThreadViews.push(<ReviewCommentThreadView key={thread.id} paper={props.paper} thread={thread} position={position} />)
        }
        setThreadViews(newThreadViews)
    }

    const handleClick = function(event) {
        event.preventDefault()
        const rect = canvasRef.current.getBoundingClientRect()

        if ( reviewInProgress )  {
            const canvas = document.getElementById(`page-${props.pageNumber}-canvas`)

            const rect = canvas.getBoundingClientRect()
            const thread = {
                reviewId: reviewInProgress.id,
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
            setPostThreadsRequestId(dispatch(postReviewThreads(props.paper.id, reviewInProgress.id, thread)))
        } else {
            throw new Error('TODO handle the case where a review is not in progress.')
        }
    }

    useEffect(function() {
        if ( haveRendered && canvasRef ) {
            createThreadViews()
        }
    }, [ selectedReview ])


    useEffect(function() {
        if ( postThreadsRequest && postThreadsRequest.state == 'fulfilled' ) {
            if ( haveRendered && canvasRef ) {
                createThreadViews()
            }
        }

        return function cleanup() {
            if ( postThreadsRequest ) {
                dispatch(cleanupRequest(postThreadsRequest))
            }
        }
    }, [postThreadsRequest])

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
                setHaveRendered(true)
            }).catch(function(error) {
                console.error(error)
            })
        }
    }, [ ] )

    useEffect(function() {
        if ( canvasRef && haveRendered ) {
            createThreadViews()
        }
    }, [ haveRendered] )

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
