import React, { useState, useEffect } from 'react'

import Spinner from '/components/Spinner'

import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

import { DocumentArrowDownIcon, ChevronDoubleRightIcon, ChevronDoubleLeftIcon } from '@heroicons/react/24/outline'

import './PDFViewer.css'

const PDFViewer = function(props) {

    const [pageValue, setPageValue] = useState('1')
    const [pageNumber, setPageNumber] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const changePageNumber = function(event) {
        setPageValue(event.target.value)

        if ( parseInt(event.target.value) > 0 && parseInt(event.target.value) <= totalPages) {
            let targetNumber = parseInt(event.target.value)
            setPageNumber(targetNumber)
        }
    }

    const prevPage = function(event) {
        event.preventDefault()

        let targetNumber = pageNumber-1
        if ( targetNumber < 1) {
            targetNumber = 1
        }
        setPageNumber(targetNumber)
        setPageValue(targetNumber)
    }

    const nextPage = function(event) {
        event.preventDefault()

        let targetNumber = pageNumber+1
        if ( targetNumber > totalPages) {
            targetNumber = totalPages
        }
        setPageNumber(targetNumber)
        setPageValue(targetNumber)
    }

    const onLoadSuccess = function({ numPages}) {
        setTotalPages(numPages)
    }

    // ================= Render ===============================================


    return (
        <section className="pdf-viewer">
            <div className="controls">
                <div className="control">
                    <a href="" onClick={prevPage}><ChevronDoubleLeftIcon /> previous</a>
                </div>
                <div className="control">
                    <a href={props.url}><DocumentArrowDownIcon />Download</a>
                    <div className="page-control">
                        <input type="text" value={pageValue} onChange={changePageNumber} /> / { totalPages }
                    </div>
                </div>
                <div className="control">
                    <a href="" onClick={nextPage}>next <ChevronDoubleRightIcon /></a>
                </div>
            </div>
            <Document className="pdf-viewer-document" file={props.url} loading={<Spinner />} onLoadSuccess={onLoadSuccess} >
                <Page className="pdf-viewer-page" renderTextLayer={false} pageNumber={pageNumber} loading={<Spinner local={true} />} width={800} /> 
            </Document>
        </section>
    )

}

export default PDFViewer 
