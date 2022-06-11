import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import Spinner from '../Spinner'


const PublishedPaperPDFPageView = function(props) {
    const { paperId } = useParams()

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

    const pageId = `page-${props.pageNumber}`
    return (
        <section className="page-wrapper">
            <canvas id={pageId}></canvas>
        </section>
    )

}

export default PublishedPaperPDFPageView 
