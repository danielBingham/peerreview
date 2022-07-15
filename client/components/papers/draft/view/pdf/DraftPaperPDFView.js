import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import { getPaper, cleanupRequest as cleanupPaperRequest } from '/state/papers'
import { getReviews, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import DraftPaperPDFPageView from './DraftPaperPDFPageView'

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

    // ======= Render State =========================================
    const [ loaded, setLoaded] = useState(false)
    const [ error, setError ] = useState(null)

    // ======= Refs =================================================
    
    const pdfRef = useRef(null)

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()
    const navigate = useNavigate()

    /**
     * Once we have the paper and the reviews, load the PDFs so we can display
     * them.
     */
    useEffect(function() {
        setLoaded(false)
        if ( props.paper.versions.length > 0 ) {
            let version = props.paper.versions.find((v) => v.version == props.versionNumber)
            if ( ! version ) {
                version = props.paper.versions[0]
            }

            const loadingTask = PDFLib.getDocument('http://' + window.location.host + version.file.filepath)
            loadingTask.promise.then(function(pdf) {
                pdfRef.current = pdf
                setLoaded(true)
            }).catch(function(error) {
                setError('rendering-error')
                console.error(error)
            })
        } else {
            setError('no-versions-error')
            console.error('Attempting to load a draft paper with no versions!')
        }
    }, [ props.paper.versions, props.versionNumber ])

    // ================= Render ===============================================
   
    let content = ( <Spinner /> )
    if ( loaded ) {
        if ( ! error ) {
            content = []
            for (let pageNumber = 1; pageNumber <= pdfRef.current.numPages; pageNumber++) {
                content.push(
                    <DraftPaperPDFPageView 
                        key={pageNumber} 
                        paper={props.paper}
                        selectedReview={props.selectedReview}
                        versionNumber={props.versionNumber}
                        pageNumber={pageNumber} 
                        pdf={pdfRef.current} 
                    />
                )
            }
        } else {
            let errorElement = null
            if ( error == 'rendering-error' ) {
                errorElement = (<div className="rendering-error">Something went wrong when loading and rendering the PDF.</div>)
            } else if ( error == 'no-versions-error' ) {
                errorElement = ( <div className="no-versions-error">Attempt to load paper with no versions!</div>)
            }
            content = (<div className="error">{ errorElement }</div>)
        }
    }

    return (
        <article id={`paper-${props.paper.id}-content`} className="draft-paper-pdf">
            { content }
        </article>
    )

}

export default DraftPaperPDFView 
