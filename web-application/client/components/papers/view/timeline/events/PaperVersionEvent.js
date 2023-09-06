import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { InboxArrowDownIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'
import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'

import './PaperVersionEvent.css'

const PaperVersionEvent = function({ eventId }) {

    // ================= Redux State ==========================================
    
    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[event.paperId]
    })


    const version = paper.versions.find((v) => v.version == event.version)

    // ================= Render ===============================================
    
    return (
        <TimelineItem>
            <TimelineIcon>
                <InboxArrowDownIcon />
            </TimelineIcon>
            <TimelineItemWrapper>
                <UserTag id={event.actorId} /> uploaded <strong><Link to={`/paper/${event.paperId}/file?version=${version.version}`}>version { version.version}</Link></strong> <DateTag timestamp={event.eventDate} type="full" />. 
            </TimelineItemWrapper>
        </TimelineItem> 
    )

}

export default PaperVersionEvent
