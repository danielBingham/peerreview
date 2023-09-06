import React from 'react'
import { useSelector } from 'react-redux'

import { InboxArrowDownIcon } from '@heroicons/react/24/outline'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'
import DateTag from '/components/DateTag'

import UserTag from '/components/users/UserTag'

import './PaperCreationEvent.css'

const PaperCreationEvent = function({ paperId }) {

    // ================= Redux State ==========================================
    
    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const submittingAuthor = paper.authors.find((a) => a.submitter == true) 

    // ================= Render ===============================================
    
    return (
        <TimelineItem>
            <TimelineIcon>
                <InboxArrowDownIcon />
            </TimelineIcon>
            <TimelineItemWrapper>
                <UserTag id={submittingAuthor.userId} /> submitted draft <DateTag timestamp={paper.createdDate} type="full" />. 
            </TimelineItemWrapper>
        </TimelineItem> 
    )

}

export default PaperCreationEvent
