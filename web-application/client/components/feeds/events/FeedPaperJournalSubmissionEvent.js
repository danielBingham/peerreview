import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { EyeIcon, InboxArrowDownIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'
import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'
import JournalTag from '/components/journals/JournalTag'

import FeedEventPaperComponent from './components/FeedEventPaperComponent'
import JournalSubmissionsListItem from '/components/journals/submissions/JournalSubmissionsListItem'

import './FeedPaperJournalSubmissionEvent.css'

const FeedPaperJournalSubmissionEvent = function({ eventId }) {

    // ================= Redux State ==========================================

    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[event.paperId]
    })

    const submission = useSelector(function(state) {
        return state.journalSubmissions.dictionary[event.submissionId]
    })

    // ================= Render ===============================================

    return (
        <TimelineItem className="feed-paper-journal-submission-event">
            <TimelineIcon>
                <InboxArrowDownIcon />
            </TimelineIcon>
            <TimelineItemWrapper>
                <div className="header">
                    New submission to <JournalTag id={submission.journalId} /> -- <DateTag timestamp={event.eventDate} type="full" />
                </div>
                <div className="event-body">
                    <JournalSubmissionsListItem submissionId={event.submissionId} />
                </div>
            </TimelineItemWrapper>
        </TimelineItem> 
    )

}

export default FeedPaperJournalSubmissionEvent
