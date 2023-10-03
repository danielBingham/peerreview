import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { reflowThreads } from '/helpers/GdocStyleCommentHelper'

import ReviewCommentThreadView from '/components/reviews/comments/ReviewCommentThreadView'

import './ReviewCommentsWrapper.css'

const ReviewCommentsWrapper = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()
    const selectedReviewId = searchParams.get('review')

    // ======= Render State =========================================
    
    const [ threadReflowRequests, setThreadReflowRequests ] = useState(0)

    // ======= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[props.paperId]
    })

    const threads = useSelector(function(state) {
        if ( state.reviews.queries[props.paperId]?.list && ! selectedReviewId) {
            const reviewIds = state.reviews.queries[props.paperId].list.filter((id) => state.reviews.dictionary[id].version == props.versionNumber)
            const results = []
            for (const id of reviewIds) {
                results.push(...state.reviews.dictionary[id].threads)
            }
            // We need to sort them in the order they appear on the page in
            // order for the positioning algorithm to work below.
            results.sort((a,b) => {
                return (a.page+a.pinY) - (b.page+b.pinY)
            })
            return results
        } else if ( selectedReviewId && selectedReviewId != 'none') {
            const results = []
            if ( state.reviews.dictionary[selectedReviewId].version == props.versionNumber ) {
                results.push(...state.reviews.dictionary[selectedReviewId].threads)
                results.sort((a,b) => {
                    return (a.page+a.pinY) - (b.page+b.pinY)
                })
            }
            return results
        } else {
            return [] 
        }
    })

    // ======= Actions and Event Handling ===========================
    
    const showCollapsed = function(numberOfCollapsedThreads) {
        const collapsedElement = document.getElementById('collapsed-comments')

        const documentElement = document.getElementsByClassName(`paper-pdf-document`)[0]
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
        if ( props.loadedVersion == props.versionNumber ) {
            resetCollapsedView()

            const centeredThreadId = searchParams.get('thread')

            const shouldFocus = props.loadedVersion == props.renderedVersion
           
            const numberOfCollapsedComments = reflowThreads(threads, centeredThreadId, shouldFocus) 
            if ( numberOfCollapsedComments > 0 ) {
                showCollapsed(numberOfCollapsedComments)
            }
        }
    }

    /**
     * Trigger a reflow of the threads.
     *
     * @return {void}
     */
    const requestThreadReflow = useCallback(function() {
        setThreadReflowRequests(threadReflowRequests + 1)
    }, [ threadReflowRequests, setThreadReflowRequests ])

    // ======= Effect Handling ======================================
   

    // When the number of threads changes, then we need to reflow.  We only
    // want to do this when the paper is fully loaded and rendered.
    useEffect(function() {
        if ( props.loadedVersion == props.renderedVersion ) {
            reflow()
        }
    }, [ threads.length ])

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
    }, [ props.loadedVersion, props.renderedPages, props.renderedVersion])

    // An effect to trigger whenever searchParams changes - since that likely
    // means the selected thread has also changed.  Triggers a reflow.
    useEffect(function() {
        const centeredThread = searchParams.get('thread')
        if ( centeredThread !== null ) {
            reflow()
        }

        const reviewId = searchParams.get('review')
        if ( reviewId ) {
            if ( reviewId != selectedReviewId ) {
                reflow()
            }
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
    }, [ searchParams, props.versionNumber, props.paperId ])
    
    // ======= Render =========================================================

    const selectedThread = searchParams.get('thread')
    const threadViews = []
    if ( props.versionNumber == props.loadedVersion) {
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

    return (
        <>
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
        </>
    )

}

export default ReviewCommentsWrapper
