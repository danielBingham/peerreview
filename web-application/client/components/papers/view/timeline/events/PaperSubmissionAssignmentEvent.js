import React from 'react'
import { useSelector } from 'react-redux'

import { InboxArrowDownIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'
import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'
import JournalTag from '/components/journals/JournalTag'

import VisibilityControl from '/components/papers/view/timeline/events/controls/VisibilityControl'

import './PaperSubmissionAssignmentEvent.css'

const PaperSubmissionAssignmentEvent = function({ eventId }) {

    // ================= Redux State ==========================================

    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    const submission = useSelector(function(state) {
        return state.journalSubmissions.dictionary[event.submissionId]
    })

    // ================= Render ===============================================
   
    const eventTypeMap = {
        'submission:reviewer-assigned': 'assigned reviewer',
        'submission:reviewer-unassigned': 'unassigned reviewer',
        'submission:editor-assigned': 'assigned editor',
        'submission:editor-unassigned': 'unassigned editor'
    }

    return (
        <TimelineItem>
            <TimelineIcon>
                <InboxArrowDownIcon />
            </TimelineIcon>
            <TimelineItemWrapper>
                <div><UserTag id={event.actorId} /> { eventTypeMap[event.type] } <UserTag id={event.assigneeId}/> for  <JournalTag id={submission.journalId}/> <DateTag timestamp={event.eventDate} type="full" />.</div>
                <VisibilityControl eventId={eventId} />
            </TimelineItemWrapper>
        </TimelineItem> 
    )

}

export default PaperSubmissionAssignmentEvent
