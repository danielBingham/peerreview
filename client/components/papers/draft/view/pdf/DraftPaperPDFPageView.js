import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import ReviewCommentForm from '../review/ReviewCommentForm'
import Spinner from '/components/Spinner'

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
    const [commentFormElement, setCommentFormElement] = useState(null)

    const dispatch = useDispatch()

    const comments = useSelector(function(state) {
        const reviews = state.reviews.list.filter((review) => review.paperId == props.paper.id)
        const results = []
        for (const review of reviews ) {
            results.push(...review.comments.filter((comment) => comment.page == props.pageNumber))
        }
        return results
    })


    const closeReviewCommentForm = function() {
        setCommentFormElement(null)
    }

    const handleClick = function(event) {
        event.preventDefault()

        if ( ! commentFormElement ) {
            const key = event.clientY + '-' + event.clientX
            setCommentFormElement(<ReviewCommentForm close={closeReviewCommentForm} paperId={props.paper.id} pageNumber={props.pageNumber} x={event.pageX} y={event.pageY} />)
        }
    }

    useEffect(function() {
        props.pdf.getPage(props.pageNumber).then(function(page) {
            var scale = 1.5;
            var viewport = page.getViewport({ scale: scale, });
            // Support HiDPI-screens.
            var outputScale = window.devicePixelRatio || 1;

            var canvas = document.getElementById(`page-${props.pageNumber}`);
            var context = canvas.getContext('2d');

            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = Math.floor(viewport.width) + "px";
            canvas.style.height =  Math.floor(viewport.height) + "px";

            var transform = outputScale !== 1
                ? [outputScale, 0, 0, outputScale, 0, 0]
                : null;

            var renderContext = {
                canvasContext: context,
                transform: transform,
                viewport: viewport
            };
            page.render(renderContext);
        }).catch(function(error) {
            console.error(error)
        })

    }, [ props.pdf, props.pageNumber] )

    const commentElements = []
    for(const comment of comments) {
        const style = {
            position: 'absolute',
            border: 'thin solid black',
            background: 'white',
            top: comment.pinY,
            left: comment.pinX,
            padding: '5px',
            boxShadow: '1px 1px 3px #777'
        }
        commentElements.push(<div key={comment.id} id={comment.id} className="comment-outer" style={style}>
            {comment.updatedDate}
            <div className="comment-inner" style={{ padding: '5px' }} >
                {comment.content}
            </div>
        </div>)
    }

    const pageId = `page-${props.pageNumber}`
    return (
        <section className="page-wrapper">
            {commentElements}
            {commentFormElement}
            <canvas id={pageId} onClick={handleClick}></canvas>
        </section>
    )

}

export default DraftPaperPDFPageView 
