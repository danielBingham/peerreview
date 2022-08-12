import React, { useState, useCallback, useLayoutEffect, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { newReview, postReviewThreads, cleanupRequest } from '/state/reviews'

import { Document, Page } from 'react-pdf/dist/esm/entry.webpack'


import DraftPaperPDFPageView from './DraftPaperPDFPageView'
import ReviewCommentThreadView from '../review/comments/ReviewCommentThreadView'
import Spinner from '/components/Spinner'

import './DraftPaperPDFView.css'

/**
 * @see `/server/daos/papers.js::hydratePapers()` for the structure of the `paper` object.
 */

/**
 * Render the PDF file corresponding to the select version of a Draft Paper.
 * Will also render the review comment threads corresponding to the review
 * currently selected in the Redux store (or all reviews) for each page.
 *
 * @param {object} props    The React props object.
 * @param {int} props.width The page width of the pages of this PDF in pixels.
 * @param {function} props.setWidth A function to set the width of the pages of
 * this PDF in pixel on a parent component.
 * @param {object} props.paper  The `paper` object for the draft paper who's
 * PDF file we're rendering.
 * @param {int} props.versionNumber The version number corresponding to the PDF
 * file we're rendering.
 */
const DraftPaperPDFView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================
    const [ numberOfPages, setNumberOfPages ] = useState(0)
    const [ renderedVersion, setRenderedVersion ] = useState(null)

    // ======= Actions and Event Handling ===========================

    const onLoadSuccess = function(pdf) {
        setNumberOfPages(pdf.numPages)
        setRenderedVersion(props.versionNumber)
    }

    // ================= Render ===============================================

    if ( props.paper.versions.length > 0 ) {

        let version = props.paper.versions.find((v) => v.version == props.versionNumber)
        if ( ! version ) {
            version = props.paper.versions[0]
        }

        const pageViews = []
        if ( props.versionNumber == renderedVersion ) {
            for(let pageNumber = 1; pageNumber <= numberOfPages; pageNumber++) {
                pageViews.push(
                    <DraftPaperPDFPageView 
                        key={`page-${pageNumber}`} 
                        pageNumber={pageNumber}
                        paper={props.paper}
                        versionNumber={props.versionNumber}
                    />
                )
            }
        }
        const url = new URL(version.file.filepath, version.file.location)
        return (
            <article id={`paper-${props.paper.id}-content`} className="draft-paper-pdf">
                <Document 
                    className="draft-paper-pdf-document" 
                    file={url.toString()} 
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
        return (<Spinner />)
    }

}

export default DraftPaperPDFView 
