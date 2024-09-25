import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getPaperEvents, cleanupRequest } from '/state/paperEvents'

import ReviewView from '/components/reviews/view/ReviewView'
import PaperVersionEvent from './events/PaperVersionEvent'
import PaperPreprintSubmissionEvent from './events/PaperPreprintSubmissionEvent' 
import PaperJournalSubmissionEvent from './events/PaperJournalSubmissionEvent'
import PaperSubmissionAssignmentEvent from './events/PaperSubmissionAssignmentEvent'
import PaperSubmissionStatusChange from './events/PaperSubmissionStatusChange'
import PaperCommentEvent from './events/PaperCommentEvent'

const PaperVersionTimelineEventsWrapper = function({ paperId, paperVersionId }) {
    
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

    const mostRecentVisibleVersion = useSelector(function(state) {
        if ( ! ( paperId in state.paperVersions.mostRecentVersion)) {
            throw new Error(`Paper(${paperId}) missing most recent version!`)
        }
        return state.paperVersions.mostRecentVersion[paperId]
    })
   
    const events = useSelector(function(state) {
        const results = []
        const query = state.paperEvents.queries[`${paperId}-${paperVersionId}`] 
        if ( query ) {
            for ( const eventId of query.list) {
                if ( state.paperEvents.dictionary[eventId].paperVersionId == paperVersionId) {
                    results.push(state.paperEvents.dictionary[eventId])
                }
            }
        }
        return results
    })

    // ====== User Action Handling  ================================

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()
    
    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        setRequestId(dispatch(getPaperEvents(`${paperId}-${paperVersionId}`, paperId, { paperVersionId: paperVersionId })))
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
        if ( mostRecentVisibleVersion.id == paperVersionId && request?.state == 'fulfilled') {
            if ( timeoutRef.current == null ) { 
                timeoutRef.current = setTimeout(function() {
                    if ( events.length > 0 ) {
                        const last = events[events.length - 1]
                        setRequestId(dispatch(getPaperEvents(`${paperId}-${paperVersionId}`, paperId, { paperVersionId: paperVersionId, since: last.eventDate })))
                    } else {
                        setRequestId(dispatch(getPaperEvents(`${paperId}-${paperVersionId}`, paperId, { paperVersionId: paperVersionId, since: 'always' })))
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
     * 'paper:new-version', 
     * 'paper:preprint-posted',
     * 'paper:new-review', 
     * 'paper:comment-posted',
     * 'review:comment-reply-posted',
     * 'submission:new', 
     * 'submission:new-review',
     * 'submission:status-changed',
     * 'submission:reviewer-assigned',
     * 'submission:reviewer-unassigned',
     * 'submission:editor-assigned',
     * 'submission:editor-unassigned'
     ***/
    const eventViews = []
    for(const event of events) {
        if ( event.type == 'paper:new-review' || event.type == 'submission:new-review') {
            eventViews.push(
                <ReviewView key={event.id} id={event.reviewId} eventId={event.id} paperId={paperId} paperVersionId={paperVersionId} />
            )
        }

        else if ( event.type =='paper:new-version' ) {
            eventViews.push(
                <PaperVersionEvent key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type == 'paper:preprint-posted' ) {
            eventViews.push(
                <PaperPreprintSubmissionEvent key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type == 'submission:new') {
            eventViews.push(
                <PaperJournalSubmissionEvent key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type == 'submission:status-changed' ) {
            eventViews.push(
                <PaperSubmissionStatusChange key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type == 'submission:reviewer-assigned'
            || event.type == 'submission:reviewer-unassigned'
            || event.type == 'submission:editor-assigned'
            || event.type == 'submission:editor-unassigned' )
        {
            eventViews.push(
                <PaperSubmissionAssignmentEvent key={event.id} eventId={event.id} />
            )
        }

        else if ( ( event.type == 'paper:new-comment' || event.type == 'submission:new-comment' ) && event.status == 'committed') {
            eventViews.push(
                <PaperCommentEvent key={event.id} eventId={event.id} />
            )
        }
    }

    return (
        <>
            { eventViews }
        </>
    )

}

export default PaperVersionTimelineEventsWrapper



