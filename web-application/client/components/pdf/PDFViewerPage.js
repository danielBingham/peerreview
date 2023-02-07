import React, { useRef, useEffect } from 'react'

import * as PDFLib from 'pdfjs-dist/webpack'

import Spinner from '/components/Spinner'

import './PDFViewerPage.css'

// TODO This may be deprecated by react-pdf.  We're going to wait and see if
// they fix their text alignmen
const PDFViewerPage = function(props) {

    const canvasRef = useRef(null)
    const textLayerRef = useRef(null)

    useEffect(function() {
        props.pdf.getPage(props.pageNumber).then(function(page) {
            if ( canvasRef.current ) {
                const scaleViewport = page.getViewport({ scale: 1 })

                var scale =  900 / scaleViewport.width
                var viewport = page.getViewport({ scale: scale, })
                // Support HiDPI-screens.
                var outputScale = window.devicePixelRatio || 1

                var context = canvasRef.current.getContext('2d')

                canvasRef.current.width = Math.floor(viewport.width * outputScale)
                canvasRef.current.height = Math.floor(viewport.height * outputScale)
                canvasRef.current.style.width = Math.floor(viewport.width) + "px"
                canvasRef.current.style.height =  Math.floor(viewport.height) + "px"

                var transform = outputScale !== 1
                    ? [outputScale, 0, 0, outputScale, 0, 0]
                    : null

                var renderContext = {
                    canvasContext: context,
                    transform: transform,
                    viewport: viewport
                }

                page.render(renderContext)
                page.getTextContent().then(function(textContent) {
                    PDFLib.renderTextLayer({
                        textContent: textContent,
                        container: textLayerRef.current,
                        viewport : viewport
                    })
                }).catch(function(error) {
                    console.error(error)
                })
            } else {
                throw new Error('Attempted to render the page before the canvas ref was set!')
            }
        }).catch(function(error) {
            console.error(error)
        })

    }, [ props.pdf, props.pageNumber] )

    return (
        <section className="pdf-viewer-page">
            <canvas ref={canvasRef} id={`page-${props.pageNumber}`}></canvas>
            <div ref={textLayerRef} className="text-layer"></div>
        </section>
    )

}

export default PDFViewerPage 
