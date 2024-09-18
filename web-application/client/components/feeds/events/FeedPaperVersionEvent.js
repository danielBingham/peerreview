import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { InboxArrowDownIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'
import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'

import './FeedPaperVersionEvent.css'

const FeedPaperVersionEvent = function({ eventId }) {

    // ================= Redux State ==========================================
    
    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    // ================= Render ===============================================

    return (
        <TimelineItem className="feed-paper-version-event">
            <TimelineIcon>
                <InboxArrowDownIcon />
            </TimelineIcon>
            <TimelineItemWrapper>
                <div className="header">
                    <UserTag id={event.actorId} /> uploaded new version (<strong><Link to={`/paper/${event.paperId}/file?version=${event.version}`}>version { event.version}</Link></strong>) for submission -- <DateTag timestamp={event.eventDate} type="full" />
                </div>
                <div className="event-body">
                </div>
            </TimelineItemWrapper>
        </TimelineItem> 
    )

}

export default FeedPaperVersionEvent
