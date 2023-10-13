import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'

import UserProfileImage from '/components/users/UserProfileImage'

import './PaperCommentEvent.css'

const PaperCommentEvent = function({ id, eventId }) {
    
    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    const paperComment = useSelector(function(state) {
        return state.paperComments.dictionary[event.paperCommentId]
    })


    useEffect(function() {
        // Scroll to the hash once the document has loaded.
        if ( document.location.hash == `#comment-${paperComment.id}`) {
            document.querySelector(document.location.hash).scrollIntoView()
        }
    }, [ document.location.hash ])

    return (
        <div id={`comment-${paperComment.id}`} className="paper-comment-event">
            <TimelineItem>
                <TimelineIcon>
                    <UserProfileImage userId={paperComment.userId} /> 
                </TimelineIcon>
                <TimelineItemWrapper>
                    <PaperCommentView paperCommentId={paperComment.id} /> 
                </TimelineItemWrapper>
            </TimelineItem>
        </div>
    )

}

export default PaperCommentEvent
