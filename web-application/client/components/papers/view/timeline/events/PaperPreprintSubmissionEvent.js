import React from 'react'
import { useSelector } from 'react-redux'

import { InboxArrowDownIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'
import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'
import VisibilityControl from '/components/papers/view/timeline/events/controls/VisibilityControl'

import './PaperPreprintSubmissionEvent.css'

const PaperPreprintSubmissionEvent = function({ eventId }) {

    // ================= Redux State ==========================================

    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    // ================= Render ===============================================
    
    return (
        <TimelineItem className="paper-preprint-submission-event">
            <TimelineIcon>
                <InboxArrowDownIcon />
            </TimelineIcon>
            <TimelineItemWrapper>
                <UserTag id={event.actorId} /> submitted preprint <DateTag timestamp={event.eventDate} type="full" />.
                <VisibilityControl eventId={eventId} compact={true} />
            </TimelineItemWrapper>
        </TimelineItem> 
    )

}

export default PaperPreprintSubmissionEvent
