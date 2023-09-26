import React from 'react'
import { useSelector } from 'react-redux'

import { InboxArrowDownIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'
import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'
import JournalTag from '/components/journals/JournalTag'

import VisibilityControl from '/components/papers/view/timeline/events/controls/VisibilityControl'

import './PaperJournalSubmissionEvent.css'

const PaperJournalSubmissionEvent = function({ eventId }) {

    // ================= Redux State ==========================================

    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    const submission = useSelector(function(state) {
        return state.journalSubmissions.dictionary[event.submissionId]
    })

    // ================= Render ===============================================
    
    return (
        <TimelineItem>
            <TimelineIcon>
                <InboxArrowDownIcon />
            </TimelineIcon>
            <TimelineItemWrapper>
                <div><UserTag id={event.actorId} /> submitted draft to <JournalTag id={submission.journalId}/> <DateTag timestamp={event.eventDate} type="full" />. </div>
                <div><VisibilityControl eventId={event.id} /></div>
            </TimelineItemWrapper>
        </TimelineItem> 
    )

}

export default PaperJournalSubmissionEvent
