import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import { getPaper, cleanupRequest as cleanupPaperRequest } from '/state/papers'
import { getReviews, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import DraftPaperPDFPageView from './DraftPaperPDFPageView'

import Spinner from '/components/Spinner'

import './DraftPaperPDFView.css'

const DraftPaperPDFView = function(props) {
    const [ pages, setPages ] = useState(null)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    /**
     * Once we have the paper and the reviews, load the PDFs so we can display
     * them.
     */
    useEffect(function() {
        if ( props.paper.versions.length > 0 ) {
            const loadingTask = PDFLib.getDocument('http://' + window.location.host + props.paper.versions[0].file.filepath)
            loadingTask.promise.then(function(pdf) {
                const newPages = []
                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                    const pageKey = `page-${pageNumber}`
                    newPages.push(<DraftPaperPDFPageView key={pageKey} width={props.width} setWidth={props.setWidth} paper={props.paper} pageNumber={pageNumber} pdf={pdf} />)
                }
                setPages(newPages)
            }).catch(function(error) {
                console.error(error)
            })
        }

    }, [ props.paper.versions ])

    // ================= Render ===============================================
    if ( pages ) {
        const id = `paper-${props.paper.id}-content`
        return (
            <article id={id} className="draft-paper-pdf" style={ { width: props.width+'px' } }>
                { pages }
            </article>
        )
    } else {
        return (
            <Spinner />
        )
    }

}

export default DraftPaperPDFView 
