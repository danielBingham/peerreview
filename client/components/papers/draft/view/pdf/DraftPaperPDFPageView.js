import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import Spinner from '/components/Spinner'

import ReviewCommentForm from '../review/comments/ReviewCommentForm'
import ReviewCommentView from '../review/comments/ReviewCommentView'

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
    const [commentFormElement, setCommentFormElement] = useState(null)

    const dispatch = useDispatch()

    const comments = useSelector(function(state) {
        if ( state.reviews.selected[props.paper.id] ) {
            return state.reviews.selected[props.paper.id].comments.filter((c) => c.page == props.pageNumber)
        } else {
            const reviews = state.reviews.list[props.paper.id]
            const results = []
            if ( reviews ) {
                for (const review of reviews ) {
                    results.push(...review.comments.filter((c) => c.page == props.pageNumber))
                }
            }
            return results
        }
    })


    const closeReviewCommentForm = function() {
        setCommentFormElement(null)
    }

    const handleClick = function(event) {
        event.preventDefault()

        if ( ! commentFormElement ) {
            const key = event.clientY + '-' + event.clientX
            setCommentFormElement(<ReviewCommentForm close={closeReviewCommentForm} paper={props.paper} pageNumber={props.pageNumber} x={event.pageX} y={event.pageY} />)
        }
    }

    useEffect(function() {
        props.pdf.getPage(props.pageNumber).then(function(page) {
            var scale = 1.5;
            var viewport = page.getViewport({ scale: scale, });
            // Support HiDPI-screens.
            var outputScale = window.devicePixelRatio || 1;

            var canvas = document.getElementById(`page-${props.pageNumber}-canvas`);
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
            setHaveRendered(true)
        }).catch(function(error) {
            console.error(error)
        })

    }, [ props.pdf, props.pageNumber] )

    const commentElements = []
    for(const comment of comments) {
        commentElements.push(<ReviewCommentView key={comment.id} paper={props.paper} comment={comment} />)
    }

    const canvasId = `page-${props.pageNumber}-canvas`
    const pageId = `page-${props.pageNumber}`
    return (
        <section id={pageId} className="draft-paper-pdf-page">
            {commentElements}
            {commentFormElement}
            <canvas id={canvasId} onClick={handleClick} style={ haveRendered ? { display: 'block' } : { display: 'none' } }></canvas>
            { ! haveRendered && <Spinner /> }
        </section>
    )

}

export default DraftPaperPDFPageView 
