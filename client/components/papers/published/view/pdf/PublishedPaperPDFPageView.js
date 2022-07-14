import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import Spinner from '/components/Spinner'

import './PublishedPaperPDFPageView.css'

const PublishedPaperPDFPageView = function(props) {

    const canvasRef = useRef(null)

    useEffect(function() {
        props.pdf.getPage(props.pageNumber).then(function(page) {
            if ( canvasRef.current ) {
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
            } else {
                throw new Error('Attempted to render the page before the canvas ref was set!')
            }
        }).catch(function(error) {
            console.error(error)
        })

    }, [ props.pdf, props.pageNumber] )

    return (
        <section className="published-paper-page-wrapper">
            <canvas ref={canvasRef} id={`page-${props.pageNumber}`}></canvas>
        </section>
    )

}

export default PublishedPaperPDFPageView 
