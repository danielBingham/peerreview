import React, { useState, useEffect } from 'react'

import * as PDFLib from 'pdfjs-dist/webpack'

import Spinner from '/components/Spinner'

import { Document, Page } from 'react-pdf/dist/esm/entry.webpack'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

import { DownloadIcon, ChevronDoubleRightIcon, ChevronDoubleLeftIcon } from '@heroicons/react/outline'

import './PDFViewer.css'

const PDFViewer = function(props) {

    //const [pdf, setPdf] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const changePageNumber = function(event) {
        let targetNumber = event.target.value
        if ( targetNumber > pdf.numPages ) {
            targetNumber = pdf.numPages
        }
        setPageNumber(targetNumber)
    }

    const prevPage = function(event) {
        event.preventDefault()

        let targetNumber = pageNumber-1
        if ( targetNumber < 1) {
            targetNumber = 1
        }
        setPageNumber(targetNumber)
    }

    const nextPage = function(event) {
        event.preventDefault()

        let targetNumber = pageNumber+1
        if ( targetNumber > totalPages) {
            targetNumber = totalPages
        }
        setPageNumber(targetNumber)
    }

    const onLoadSuccess = function({ numPages}) {
        setTotalPages(numPages)
    }

    
    /**
     * Once we have the paper and the reviews, load the PDFs so we can display
     * them.
     */
        /*useEffect(function() {
        const loadingTask = PDFLib.getDocument('http://' + window.location.host + props.filepath)
        loadingTask.promise.then(function(loadedPdf) {
            setPdf(loadedPdf)
        }).catch(function(error) {
            console.error(error)
        })
                <PDFViewerPage key={`page-${pageNumber}`} pageNumber={pageNumber} pdf={pdf} />
    }, [ props.filepath ]) */

    // ================= Render ===============================================


    return (
        <section className="pdf-viewer">
            <div className="controls">
                <div className="control">
                    <a href="" onClick={prevPage}><ChevronDoubleLeftIcon /> previous</a>
                </div>
                <div className="control">
                    <a href={`http://${window.location.host}${props.filepath}`}><DownloadIcon /></a>
                    <div className="page-control">
                        <input type="text" value={pageNumber} onChange={changePageNumber} /> / { totalPages }
                    </div>
                </div>
                <div className="control">
                    <a href="" onClick={nextPage}>next <ChevronDoubleRightIcon /></a>
                </div>
            </div>
            <Document file={`http://${window.location.host}${props.filepath}`} onLoadSuccess={onLoadSuccess} >
                <Page pageNumber={pageNumber} width={900} />
            </Document>
        </section>
    )

}

export default PDFViewer 