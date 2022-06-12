import React, { useState, useEffect } from 'react'

import * as PDFLib from 'pdfjs-dist/webpack'

import Spinner from '/components/Spinner'

import PublishedPaperPDFPageView from './PublishedPaperPDFPageView'

const PublishedPaperPDFView = function(props) {

    const [ pages, setPages ] = useState([])
    
    /**
     * Once we have the paper and the reviews, load the PDFs so we can display
     * them.
     */
    useEffect(function() {
        console.log('Attempting render.')
        if (  props.paper.versions.length > 0 ) {
            const loadingTask = PDFLib.getDocument('http://' + window.location.host + props.paper.versions[0].filepath)
            loadingTask.promise.then(function(pdf) {
                const newPages = []
                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                    const pageKey = `page-${pageNumber}`
                    newPages.push(<PublishedPaperPDFPageView key={pageKey} pageNumber={pageNumber} pdf={pdf} />)
                }
                setPages(newPages)
            }).catch(function(error) {
                console.error(error)
            })
        }

    }, [ props.paper.versions ])

    // ================= Render ===============================================

    return (
        <section className="paper-pdf-view">
            { pages }
        </section>
    )

}

export default PublishedPaperPDFView 
