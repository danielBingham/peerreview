import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import { getPaper, cleanupRequest as cleanupPaperRequest } from '/state/papers'

import Spinner from '/components/Spinner'

import PublishedPaperAuthorsWidget from './widgets/PublishedPaperAuthorsWidget'
import PublishedPaperFieldsWidget from './widgets/PublishedPaperFieldsWidget'
import PublishedPaperVoteWidget from './widgets/PublishedPaperVoteWidget'

import PublishedPaperPDFView from './pdf/PublishedPaperPDFView'


const PublishedPaperView = function(props) {
    const [ paperRequestId, setPaperRequestId ] = useState(null)

    const { id } = useParams() 

    const dispatch = useDispatch()

    // ================= Request Tracking =====================================
    const paperRequest = useSelector(function(state) {
        if ( ! paperRequestId) {
            return null
        } else {
           return state.papers.requests[paperRequestId]
        }
    })

    // ================= Redux State ==========================================

    const paper = useSelector(function(state) {
        if ( ! state.papers.dictionary[id] ) {
            return null
        } else {
            return state.papers.dictionary[id]
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ================= User Action Handling  ================================

    useEffect(function() {
        if ( ! paper && ! paperRequest ) {
            setPaperRequestId(dispatch(getPaper(id)))
        } 

        return function cleanup() {
            if ( paperRequest ) {
                dispatch(cleanupPaperRequest(paperRequestId))
            }

        }

    }, [id])

    // ================= Render ===============================================
    
    if ( ! paper ) {
        return ( <Spinner /> )
    } else {
        return (
            <section id={paper.id} className="paper">
                <h2 className="paper-title">{paper.title}</h2>
                <PublishedPaperAuthorsWidget paper={paper} />
                <PublishedPaperFieldsWidget paper={paper} />
                <PublishedPaperVoteWidget paper={paper} />
                <PublishedPaperPDFView paper={paper} />
            </section>
        )
    }
}

export default PublishedPaperView
