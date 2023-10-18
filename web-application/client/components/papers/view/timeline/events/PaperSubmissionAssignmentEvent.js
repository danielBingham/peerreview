import React from 'react'
import { useSelector } from 'react-redux'

import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline'

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
        'submission:reviewer-assigned': { name: 'assigned reviewer', icon: ( <UserPlusIcon /> ) },
        'submission:reviewer-unassigned': { name: 'unassigned reviewer', icon: ( <UserMinusIcon /> ) },
        'submission:editor-assigned': { name: 'assigned editor', icon: ( <UserPlusIcon /> ) },
        'submission:editor-unassigned': { name: 'unassigned editor', icon: ( <UserMinusIcon /> ) }
    }


    return (
        <TimelineItem className="paper-submission-assignment-event">
            <TimelineIcon>
                { eventTypeMap[event.type].icon } 
            </TimelineIcon>
            <TimelineItemWrapper>
                <UserTag id={event.actorId} /> { eventTypeMap[event.type].name } <UserTag id={event.assigneeId}/> for  <JournalTag id={submission.journalId}/> <DateTag timestamp={event.eventDate} type="full" />. <VisibilityControl eventId={eventId} compact={true} />
            </TimelineItemWrapper>
        </TimelineItem> 
    )

}

export default PaperSubmissionAssignmentEvent
