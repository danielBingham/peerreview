import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Page } from 'react-pdf/dist/esm/entry.webpack'

import ReviewSummaryView from '/components/reviews/widgets/ReviewSummaryView'
import ReviewCommentThreadView from '/components/reviews/comments/ReviewCommentThreadView'
import ReviewCommentThreadPinView from '/components/reviews/comments/ReviewCommentThreadPinView'

import Spinner from '/components/Spinner'

import './CommentThreadView.css'

const CommentThreadView = function({ id, reviewId, paperId, versionNumber }) {

    const [ width, setWidth ] = useState(0)
    const [ height, setHeight ] = useState(0)

    const [ hiddenCanvasLoaded, setHiddenCanvasLoaded ] = useState(false)
    const [ canvasRendered, setCanvasRendered ] = useState(false)

    let hiddenCanvasRef = useRef(null)
    let canvasRef = useRef(null)

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const review = useSelector(function(state) {
        if ( ! state.reviews.dictionary[paperId] ) {
            return null
        }

        return state.reviews.dictionary[paperId][reviewId]
    })

    const thread = useSelector(function(state) {
        if ( ! state.reviews.dictionary[paperId] ) {
            return null
        }

        if ( ! state.reviews.dictionary[paperId][reviewId] ) {
            return null
        }

        return state.reviews.dictionary[paperId][reviewId].threads.find((t) => t.id == id)
    })

    useEffect(function() {
        if ( hiddenCanvasLoaded && canvasRef.current && hiddenCanvasRef.current ) {
            const context = canvasRef.current.getContext("2d")

            // Handle high DPI devices.
            const scale = window.devicePixelRatio

            canvasRef.current.style.width = '800px'
            canvasRef.current.style.height = '200px'

            canvasRef.current.width = Math.floor(800*scale)
            canvasRef.current.height = Math.floor(200*scale)

            context.scale(scale, scale)

            // TECHDEBT This was a guess that seems to be working.  I'm actually a little uneasy with the fact that it seems to be working.  
            context.drawImage(hiddenCanvasRef.current, 0, ((thread.pinY*height)-100)*scale, 800*scale, 200*scale, 0, 0, 800, 200)
            setCanvasRendered(true)
        }
    }, [ hiddenCanvasLoaded ])


    return (
        <div className="comment-thread-view-wrapper">
            <div className="page-number">
                On Page { thread.page }
            </div>
            <div className="page-viewport">
                { ! canvasRendered && <div className="loading"><Spinner local={true} /></div> }
                { canvasRendered && <div 
                    className="comment-thread-pin"
                    style={{ 
                        top: '100px', 
                        left: parseInt(thread.pinX*width)+ 'px' 
                    }}
                >
                </div> }
                <Page 
                    className={`review-view-react-pdf-page`}
                    canvasRef={hiddenCanvasRef}
                    pageNumber={thread.page} 
                    width={800} 
                    onRenderSuccess={(page) => {
                        setWidth(page.width)
                        setHeight(page.height)
                        setHiddenCanvasLoaded(true)
                    }}
                /> 
                <canvas 
                    id={`review-${review.id}-thread-${thread.id}-canvas`} 
                    width={800} 
                    height={200} 
                    ref={canvasRef} 
                    className={`comment-canvas ${canvasRendered ? '' : 'hidden'}`} 
                />
            </div>
            <ReviewCommentThreadView 
                paper={paper} 
                reviewId={review.id}
                id={thread.id}
            />
        </div>
    )

}

export default CommentThreadView 
