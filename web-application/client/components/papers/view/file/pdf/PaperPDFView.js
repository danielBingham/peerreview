import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams, useLocation } from 'react-router-dom'

import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

import PaperPDFPageView from './PaperPDFPageView'
import ReviewCommentsWrapper from '/components/reviews/comments/ReviewCommentsWrapper'
import Spinner from '/components/Spinner'

import './PaperPDFView.css'

/**
 * @see `/server/daos/papers.js::hydratePapers()` for the structure of the `paper` object.
 */

/**
 * Render the PDF file corresponding to the select version of a Draft Paper.
 * Will also render the review comment threads corresponding to the review
 * currently selected in the Redux store (or all reviews) for each page.
 *
 * @param {object} props    The React props object.
 * @param {object} paper  The `paper` object for the draft paper who's
 * PDF file we're rendering.
 * @param {int} props.versionNumber The version number corresponding to the PDF
 * file we're rendering.
 */
const PaperPDFView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================
    const [ numberOfPages, setNumberOfPages ] = useState(0)
    const [ loadedVersion, setLoadedVersion ] = useState(null)
    const [ renderedVersion, setRenderedVersion ] = useState(null)
    const [ renderedPages, setRenderedPages ] = useState(0)

    // ======= Redux State ==========================================

    const file = useSelector(function(state) {
        if ( ! state.paperVersions.files[props.paperId] ) {
            return null
        }

        return state.paperVersions.files[props.paperId][props.versionNumber]
    })

    // We need this to be a ref because the callback can be called mutliple
    // times in a single render loop.  When that happens, if we're using state,
    // it will only record a single page as rendered, even if dozens have
    // returned rendered.
    const renderedPagesCount = useRef(0)
    if ( renderedPagesCount.current !== 0 && loadedVersion !== props.versionNumber ) {
        renderedPagesCount.current = 0
    }


    // ======= Actions and Event Handling ===========================

    /**
     * Handler for the PDF has Loaded event.  Takes the pdf object and pulls
     * from data from it, then records that we've successfully loaded.
     *
     * @param {Object} pdf  The pdf document object returned by ReactPDF's Document component.
     *
     * @return {void}
     */
    const onLoadSuccess = useCallback(function(pdf) {
        setNumberOfPages(pdf.numPages)
        setLoadedVersion(props.versionNumber)
    }, [ props.versionNumber, setNumberOfPages, setLoadedVersion ])

    const onRenderSuccess = useCallback(function() {
        // TECHDEBT Hack - see comment on ref definition.
        renderedPagesCount.current += 1
        setRenderedPages(renderedPagesCount.current)
    }, [ renderedPages, setRenderedPages ])    

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( renderedPages !== 0 && loadedVersion != props.versionNumber ) {
            setRenderedPages(0)
        }
    }, [ loadedVersion, props.versionNumber ])

    useEffect(function() {
        if ( renderedPages == numberOfPages && numberOfPages !== 0 ) {
            setRenderedVersion(props.versionNumber)
        }
    }, [ renderedPages ])

    // ================= Render ===============================================

    if ( file) {
        const pageViews = []
        if ( props.versionNumber == loadedVersion) {
            for(let pageNumber = 1; pageNumber <= numberOfPages; pageNumber++) {
                pageViews.push(
                    <PaperPDFPageView 
                        key={`page-${pageNumber}`} 
                        pageNumber={pageNumber}
                        paperId={props.paperId}
                        versionNumber={props.versionNumber}
                        onRenderSuccess={onRenderSuccess}
                    />
                )
            }
        }
        
        return (
            <article id={`paper-${props.paperId}-content`} className="paper-pdf">
                <ReviewCommentsWrapper 
                    paperId={props.paperId} 
                    versionNumber={props.versionNumber} 
                    loadedVersion={loadedVersion}
                    renderedPages={renderedPages}
                    renderedVersion={renderedVersion}
                />
                <Document 
                    className="paper-pdf-document" 
                    file={file} 
                    loading={<Spinner />} 
                    onLoadSuccess={onLoadSuccess}
                    onSourceError={(error) => console.log(error)}
                    onLoadError={(error) => console.log(error)}
                >
                    { pageViews }
                </Document>
            </article>
        )
    } else {
        return (
            <article id={`paper-${props.paperId}-content`} className="paper-pdf">
                <Spinner local={true} />
            </article>
        )
    }

}

export default PaperPDFView 
