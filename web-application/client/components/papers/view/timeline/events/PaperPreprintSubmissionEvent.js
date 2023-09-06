import React from 'react'
import { useSelector } from 'react-redux'

import { InboxArrowDownIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'
import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'

import './PaperPreprintSubmissionEvent.css'

const PaperPreprintSubmissionEvent = function({ eventId }) {

    // ================= Redux State ==========================================

    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    // ================= Render ===============================================
    
    return (
        <TimelineItem>
            <TimelineIcon>
                <InboxArrowDownIcon />
            </TimelineIcon>
            <TimelineItemWrapper>
                <UserTag id={event.actorId} /> submitted preprint <DateTag timestamp={event.eventDate} type="full" />. 
            </TimelineItemWrapper>
        </TimelineItem> 
    )

}

export default PaperPreprintSubmissionEvent
