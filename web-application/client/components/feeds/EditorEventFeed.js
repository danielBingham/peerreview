import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getEditorFeed, cleanupRequest } from '/state/paperEvents'

import { Timeline } from '/components/generic/timeline/Timeline'

import FeedPaperReviewView from './events/FeedPaperReviewView'
import FeedPaperVersionEvent from './events/FeedPaperVersionEvent'
import PaperPreprintSubmissionEvent from '/components/papers/view/timeline/events/PaperPreprintSubmissionEvent' 
import FeedPaperJournalSubmissionEvent from './events/FeedPaperJournalSubmissionEvent' 
import FeedPaperSubmissionAssignmentEvent from './events/FeedPaperSubmissionAssignmentEvent'
import PaperSubmissionStatusChange from '/components/papers/view/timeline/events/PaperSubmissionStatusChange'

const EditorEventFeed = function({ }) {

    // ============ Request Tracking ==========================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( state.paperEvents.requests[requestId] ) {
            return state.paperEvents.requests[requestId]
        } else {
            return null
        }
    })

    // ============ Redux State ===============================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const events = useSelector(function(state) {
        const results = []
        const query = state.paperEvents.queries['EditorEventFeed'] 
        if ( query ) {
            for ( const eventId of query.list) {
                results.push(state.paperEvents.dictionary[eventId])
            }
        }
        return results
    })

    // ============ Effect Handling ===========================================

    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getEditorFeed('EditorEventFeed', { relations: [ 'papers' ] })))   
    }, [])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ============ Render ====================================================

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
    */
    const eventViews = []
    for(const event of events) {
        if ( event.type == 'submission:new-review' ) {
            eventViews.push(
                <FeedPaperReviewView key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type =='paper:new-version' ) {
            eventViews.push(
                <FeedPaperVersionEvent key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type == 'submission:new') {
            eventViews.push(
                <FeedPaperJournalSubmissionEvent key={event.id} eventId={event.id} />
            )
        }

        else if ( event.type == 'submission:status-changed' ) {
            eventViews.push(
                <PaperSubmissionStatusChange key={event.id} eventId={event.id} />
            )
        }
    }

    return (
        <div className="editor-event-feed">
            <Timeline>
                { eventViews }
            </Timeline>
        </div>
    )
}

export default EditorEventFeed
