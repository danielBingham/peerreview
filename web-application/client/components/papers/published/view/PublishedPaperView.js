import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { getPaper, cleanupRequest as cleanupPaperRequest } from '/state/papers'

import DateTag from '/components/DateTag'
import Spinner from '/components/Spinner'

import PublishedPaperAuthorsWidget from './widgets/PublishedPaperAuthorsWidget'
import PublishedPaperFieldsWidget from './widgets/PublishedPaperFieldsWidget'

import PublishedPaperPDFView from './pdf/PublishedPaperPDFView'

import ResponseList from '/components/responses/ResponseList'

import './PublishedPaperView.css'

/**
 * 
 * @param {Object} props    Standard React props object.
 * @param {integer} props.id    The id of the paper we're going to display.
 */
const PublishedPaperView = function({ id }) {

    // ================= Request Tracking =====================================

    const [ paperRequestId, setPaperRequestId ] = useState(null)
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

    // ================= Effect Handling  ================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        setPaperRequestId(dispatch(getPaper(id)))
    }, [id])

    useEffect(function() {
        return function cleanup() {
            if ( paperRequestId ) {
                dispatch(cleanupPaperRequest({ requestId: paperRequestId }))
            }
        }
    }, [ paperRequestId ])

    // ================= Render ===============================================

    // TODO Redirect to a 404 page in this case.
    if ( ! paper ) {
        return ( <Spinner /> )
    } else {
        return (
            <>
                <article id={paper.id} className="published-paper">
                    <section className="header">
                        <h2 className="paper-title">{paper.title}</h2>
                        <PublishedPaperFieldsWidget paper={paper} />
                    </section>
                    <aside className="sidebar">
                        <div className="published-paper-vote-widget">
                            <div className="score">{paper.score}</div>
                        </div>
                        <div className="published-date">published <DateTag timestamp={paper.updatedDate} /></div>
                        <PublishedPaperAuthorsWidget paper={paper} />
                    </aside>
                    <section className="main">
                        <PublishedPaperPDFView paper={paper} />
                    </section>
                </article>
                <ResponseList paper={paper} />
            </>
        )
    }
}

export default PublishedPaperView
