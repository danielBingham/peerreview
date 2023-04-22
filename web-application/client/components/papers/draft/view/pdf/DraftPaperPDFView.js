import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams, useLocation } from 'react-router-dom'

import { newReview, postReviewThreads, cleanupRequest } from '/state/reviews'

import { reflowThreads } from '/helpers/GdocStyleCommentHelper'

import { Document, Page } from 'react-pdf/dist/esm/entry.webpack'

import DraftPaperPDFPageView from './DraftPaperPDFPageView'
import ReviewCommentThreadView from '/components/reviews/comments/ReviewCommentThreadView'
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
 * @param {object} paper  The `paper` object for the draft paper who's
 * PDF file we're rendering.
 * @param {int} props.versionNumber The version number corresponding to the PDF
 * file we're rendering.
 */
const DraftPaperPDFView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================
    const [ numberOfPages, setNumberOfPages ] = useState(0)
    const [ loadedVersion, setLoadedVersion ] = useState(null)
    const [ renderedVersion, setRenderedVersion ] = useState(null)
    const [ threadReflowRequests, setThreadReflowRequests ] = useState(0)

    const renderedPages = useRef(0)
    if ( renderedPages.current !== 0 && renderedVersion != props.versionNumber ) {
        renderedPages.current = 0
    }

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[props.paperId]
    })

    const threads = useSelector(function(state) {
        if ( state.reviews.list[props.paperId] ) {
            const reviews = state.reviews.list[props.paperId][props.versionNumber]
            const results = []
            if ( reviews && reviews.length > 0 ) {
                for (const review of reviews ) {
                    results.push(...review.threads)
                }
            }
            // We need to sort them in the order they appear on the page in
            // order for the positioning algorithm to work below.
            results.sort((a,b) => {
                return (a.page+a.pinY) - (b.page+b.pinY)
            })
            return results
        } else {
            return [] 
        }
    })

    // ======= Actions and Event Handling ===========================

    /**
     * Handler for the PDF has Loaded event.  Takes the pdf object and pulls
     * from data from it, then records that we've successfully loaded.
     *
     * @param {Object} pdf  The pdf document object returned by ReactPDF's Document component.
     *
     * @return {void}
     */
    const onLoadSuccess = function(pdf) {
        setNumberOfPages(pdf.numPages)
        setLoadedVersion(props.versionNumber)
    }

    /**
     * Trigger a reflow of the threads.
     *
     * @return {void}
     */
    const requestThreadReflow = function() {
        setThreadReflowRequests(threadReflowRequests + 1)
    }

    const showCollapsed = function(numberOfCollapsedThreads) {
        const collapsedElement = document.getElementById('collapsed-comments')

        const documentElement = document.getElementsByClassName(`draft-paper-pdf-document`)[0]
        const documentRect = documentElement.getBoundingClientRect()

        collapsedElement.style.top = -60 + 'px'
        collapsedElement.style.left = parseInt(documentRect.width + 5) + 'px'

        const countElement = document.getElementById('count')
        countElement.innerText = numberOfCollapsedThreads 

        collapsedElement.classList.add('show')
    }

    const resetCollapsedView = function() {
        const collapsedElement = document.getElementById('collapsed-comments')
        collapsedElement.classList.remove('show')
    }

    const reflow = function() {
        if ( loadedVersion == props.versionNumber ) {
            resetCollapsedView()

            const centeredThreadId = searchParams.get('thread')
            const numberOfCollapsedComments = reflowThreads(threads, centeredThreadId) 
            if ( numberOfCollapsedComments > 0 ) {
                showCollapsed(numberOfCollapsedComments)
            }
        }
    }

    // An effect to trigger when we've successfully loaded and rendered a new
    // PDF.  Does an initial positioning of that PDF's threads.
    useEffect(function() {
        // NOTE: This positioning algorithm assumes that `threads` has been
        // sorted and the threads are in the order they appear on the document,
        // from top to bottom.
        //
        // On the initial pass we want to spread from the top first, and then
        // we want to spread from the centered thread.  The algorithm for
        // spreading from the centered thread assumes the threads have already
        // been spread from the top.
        reflow()
    }, [ loadedVersion, renderedVersion])

    // An effect to trigger whenever searchParams changes - since that likely
    // means the selected thread has also changed.  Triggers a reflow.
    useEffect(function() {
        const centeredThread = searchParams.get('thread')
        if ( centeredThread !== null ) {
            reflow()
        }
    }, [ searchParams ])

    // The effect that watches the threadReflowRequests and executes the
    // requested reflow.
    useEffect(function() {
        if ( threadReflowRequests > 0 ) {
            setThreadReflowRequests(0)
            reflow()
        }
    }, [ threadReflowRequests ])

    // If they click off the thread or the pin, then we want to unselect the
    // thread.
    useEffect(function() {
        const onBodyClick = function(event) {
            if ( ! event.target.matches('.comment-thread-pin') &&  ! event.target.matches('.comment-thread') 
                && ! event.target.matches('.comment-thread-pin :scope') && ! event.target.matches('.comment-thread :scope') ) 
            {
                searchParams.delete('thread')
                setSearchParams(searchParams)
            } 
        }
        document.body.addEventListener('click', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('click', onBodyClick)
        }
    }, [ searchParams, props.versionNumber ])


    // ================= Render ===============================================

    if ( paper.versions.length > 0 ) {

        let version = paper.versions.find((v) => v.version == props.versionNumber)
        if ( ! version ) {
            version = paper.versions[0]
        }
        const pageViews = []
        if ( props.versionNumber == loadedVersion) {
            for(let pageNumber = 1; pageNumber <= numberOfPages; pageNumber++) {
                pageViews.push(
                    <DraftPaperPDFPageView 
                        key={`page-${pageNumber}`} 
                        pageNumber={pageNumber}
                        paper={paper}
                        versionNumber={props.versionNumber}
                        requestThreadReflow={requestThreadReflow}
                        onRenderSuccess={function() {
                            renderedPages.current = renderedPages.current+1

                            setThreadReflowRequests(threadReflowRequests+1)
                            if ( renderedPages.current == numberOfPages ) {
                                setRenderedVersion(props.versionNumber)
                            }
                        }}
                    />
                )
            }
        }

        const selectedThread = searchParams.get('thread')
        const threadViews = []
        if ( props.versionNumber == loadedVersion) {
            for(let thread of threads) {
                threadViews.push(
                    <div 
                        id={`thread-${thread.id}-wrapper`} 
                        key={thread.id} 
                        className={`thread-wrapper ${thread.id == selectedThread ? 'selected' : ''} `}
                        onClick={ (e) => { 
                            searchParams.set('thread', thread.id)
                            setSearchParams(searchParams)
                        }}
                    >
                        <ReviewCommentThreadView 
                            key={thread.id} 
                            paper={paper} 
                            versionNumber={props.versionNumber}
                            reviewId={thread.reviewId}
                            requestThreadReflow={requestThreadReflow}
                            id={thread.id}
                        />
                    </div>
                )
            }

        }

        const url = new URL(version.file.filepath, version.file.location)
        const urlString = url.toString()
        return (
            <article id={`paper-${props.paperId}-content`} className="draft-paper-pdf">
                <div id="collapsed-comments" onClick={(e) => {
                    searchParams.delete('thread')
                    setSearchParams(searchParams)
                    // NOTE: we need to trigger a thread reflow rather than directly calling reflow threads here to avoid
                    // running the reflow in the middle of Reacts render cycle.  The flow *MUST* be run after React has
                    // rendered.
                    requestThreadReflow()
                }}>
                    <div>Not showing <span id="count">0</span> collapsed comments.</div>
                    <div className="instructions">Click here to expand.</div>
                </div>
                {threadViews}
                <Document 
                    className="draft-paper-pdf-document" 
                    file={urlString} 
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
