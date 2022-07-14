import React, { useState, useRef, useEffect } from 'react'

import * as PDFLib from 'pdfjs-dist/webpack'

import Spinner from '/components/Spinner'

import PublishedPaperPDFPageView from './PublishedPaperPDFPageView'

const PublishedPaperPDFView = function(props) {

    const [pdf, setPdf] = useState(null)
    
    /**
     * Once we have the paper and the reviews, load the PDFs so we can display
     * them.
     */
    useEffect(function() {
        if (  props.paper.versions.length > 0 ) {
            const loadingTask = PDFLib.getDocument('http://' + window.location.host + props.paper.versions[0].file.filepath)
            loadingTask.promise.then(function(loadedPdf) {
                setPdf(loadedPdf)
            }).catch(function(error) {
                console.error(error)
            })
        }
    }, [ props.paper.versions ])

    // ================= Render ===============================================

    const pages = []
    if ( pdf ) {
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            pages.push(<PublishedPaperPDFPageView key={`page-${pageNumber}`} pageNumber={pageNumber} pdf={pdf} />)
        }
    }

    return (
        <section className="paper-pdf-view">
            { pages }
        </section>
    )

}

export default PublishedPaperPDFView 
