import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getPaperEvents, cleanupRequest } from '/state/paperEvents'

import ReviewView from '/components/reviews/view/ReviewView'
import PaperVersionEvent from './events/PaperVersionEvent'
import PaperPreprintSubmissionEvent from './events/PaperPreprintSubmissionEvent' 
import PaperJournalSubmissionEvent from './events/PaperJournalSubmissionEvent'
import PaperSubmissionAssignmentEvent from './events/PaperSubmissionAssignmentEvent'
import PaperSubmissionStatusChange from './events/PaperSubmissionStatusChange'

const PaperVersionTimelineEventsWrapper = function({ paperId, versionNumber }) {
    
    const timeoutRef = useRef(null)

    // ================= Request Tracking =====================================
    
    const [ requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
           return state.paperEvents.requests[requestId]
        }
    })

    // ================= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })
   
    const events = useSelector(function(state) {
        const results = []
        const query = state.paperEvents.queries[`${paperId}-${versionNumber}`] 
        if ( query ) {
            for ( const eventId of query.list) {
                if ( state.paperEvents.dictionary[eventId].version == versionNumber) {
                    results.push(state.paperEvents.dictionary[eventId])
                }
            }
        }
        return results
    })

    const reviewInProgress = useSelector(function(state) {
        if ( state.reviews.inProgress[paperId] ) {
            return state.reviews.inProgress[paperId][versionNumber]
        } else {
            return null
        }
    })

    // ====== User Action Handling  ================================

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()
    
    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        setRequestId(dispatch(getPaperEvents(`${paperId}-${versionNumber}`, paperId, { version: versionNumber })))
    }, [])
   
    // Poll for new events.
    //
    // TECHDEBT This is an inefficient way of doing this.  It causes a
    // re-render on each polling request.  If we want to avoid this, we could
    // wrap the polling request in a "new events" container that remains empty
    // until new events are returned, then stops polling, renders the new
    // events and another copy of itself that would remain the empty container
    // until new events appear.
    //
    // But this is probably good enough for now.
    useEffect(function() {
        if ( paper.versions[0].version == versionNumber && request?.state == 'fulfilled') {
            if ( timeoutRef.current == null ) { 
                timeoutRef.current = setTimeout(function() {
                    console.log('polling.')
                    if ( events.length > 0 ) {
                        const last = events[events.length - 1]
                        setRequestId(dispatch(getPaperEvents(`${paperId}-${versionNumber}`, paperId, { version: versionNumber, since: last.eventDate })))
                    } else {
                        setRequestId(dispatch(getPaperEvents(`${paperId}-${versionNumber}`, paperId, { version: versionNumber, since: 'always' })))
                    }
                    timeoutRef.current = null
                }, 5000)
            }
        }
        // TECHDEBT This works.  But it's not entirely clear WHY it works vs
        // other solutions.  Or rather, it's clear why, but not why the other
        // solutions don't work.
        //
        // In any case, it works for now.  It may prove brittle.
        return function() {
            if ( timeoutRef.current ) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null  
            }

        }
    }, [ request ])

    useEffect(function() {
        return function cleanup() {
            if ( timeoutRef.current ) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ====== Render ===============================================
   
    /**
     * Event Types
     *
     * 'version-uploaded', 
     * 'preprint-posted',
     * 'review-posted', 
     * 'review-comment-reply-posted',
     * 'comment-posted',
     * 'submitted-to-journal', 
     * 'submission-status-changed',
     * 'reviewer-assigned',
     * 'reviewer-unassigned',
     * 'editor-assigned',
     * 'editor-unassigned'
    */
    const eventViews = []
    for(const event of events) {
        if ( event.type == 'review-posted' ) {
            eventViews.push(
                <ReviewView key={event.id} id={event.reviewId} paperId={paperId} versionNumber={versionNumber} />
            )
        }

        else if ( event.type =='version-uploaded' ) {
            eventViews.push(
                <PaperVersionEvent key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type == 'preprint-posted' ) {
            eventViews.push(
                <PaperPreprintSubmissionEvent key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type == 'submitted-to-journal') {
            eventViews.push(
                <PaperJournalSubmissionEvent key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type == 'submission-status-changed' ) {
            eventViews.push(
                <PaperSubmissionStatusChange key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type == 'reviewer-assigned'
            || event.type == 'reviewer-unassigned'
            || event.type == 'editor-assigned'
            || event.type == 'editor-unassigned' )
        {
            eventViews.push(
                <PaperSubmissionAssignmentEvent key={event.id} eventId={event.id} />
            )
        }
    }

    let reviewInProgressView = null
    if ( reviewInProgress ) {
        reviewInProgressView = (
            <ReviewView id={reviewInProgress.id} paperId={paperId} versionNumber={versionNumber} />
        )
    }

    return (
        <>
            { eventViews }
            { reviewInProgressView }
        </>
    )

}

export default PaperVersionTimelineEventsWrapper


