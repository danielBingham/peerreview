import React from 'react'
import { useSelector } from 'react-redux'

import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'
import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'
import JournalTag from '/components/journals/JournalTag'
import VisibilityControl from '/components/papers/view/timeline/events/controls/VisibilityControl'

import './PaperSubmissionStatusChange.css'

const PaperSubmissionStatusChange = function({ eventId }) {

    // ================= Redux State ==========================================

    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    const submission = useSelector(function(state) {
        return state.journalSubmissions.dictionary[event.submissionId]
    })

    // ================= Render ===============================================

    const statuses = {
        'private-draft': 'Private Draft',
        preprint: 'Preprint',
        submitted: 'Submitted',
        review: 'In Review',
        proofing: 'In Proofing',
        rejected: 'Rejected',
        published: 'Published',
        retracted: 'Retracted'
    }

    return (
        <TimelineItem className="paper-submission-status-change-event" >
            <TimelineIcon>
                <ArrowPathRoundedSquareIcon />
            </TimelineIcon>
            <TimelineItemWrapper>
                <UserTag id={event.actorId} /> changed status to <strong>{ statuses[event.newStatus] }</strong> for  <JournalTag id={submission.journalId}/> <DateTag timestamp={event.eventDate} type="full" />. <VisibilityControl eventId={eventId} compact={true} />
            </TimelineItemWrapper>
        </TimelineItem> 
    )

}

export default PaperSubmissionStatusChange
