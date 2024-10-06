import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { InboxArrowDownIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'
import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'
import VisibilityControl from '/components/papers/view/timeline/events/controls/VisibilityControl'
import VisibilityBar from '/components/papers/view/timeline/events/controls/VisibilityBar'

import './PaperVersionEvent.css'

const PaperVersionEvent = function({ eventId }) {

    // ================= Redux State ==========================================
    
    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    const version = useSelector(function(state) {
        return state.paperVersions.dictionary[event.paperVersionId]
    })

    // ================= Render ===============================================
    
    return (
        <TimelineItem className="paper-version-event">
            <TimelineIcon>
                <InboxArrowDownIcon />
            </TimelineIcon>
            <TimelineItemWrapper>
                <div className="paper-version-event-header">
                    <UserTag id={event.actorId} /> uploaded <strong><Link to={`/paper/${event.paperId}/file?version=${version.id}`}>version { version.id}</Link></strong> <DateTag timestamp={event.eventDate} type="full" />.  
                </div>
                <div className="paper-version-event-status">
                    <div className={ version.isPreprint ? "yes" : "no" }>{ version.isPreprint ? "preprint" : "not preprint" }</div>
                    <div className={ version.isSubmitted ? "yes" : "no" }>{ version.isSubmitted ? "submitted": "not submitted" }</div>
                    <div className={version.isPublished ? "yes" : "no" }>{ version.isPublished ? "published": "not published" }</div>
                </div>
            </TimelineItemWrapper>
                    
        </TimelineItem> 
    )

}

export default PaperVersionEvent
