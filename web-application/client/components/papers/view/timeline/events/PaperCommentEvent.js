import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'

import UserProfileImage from '/components/users/UserProfileImage'
import PaperCommentView from '/components/papers/comments/view/PaperCommentView'

import './PaperCommentEvent.css'

const PaperCommentEvent = function({ eventId }) {

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
                    <div className="comment-wrapper">
                        <PaperCommentView eventId={eventId}  paperCommentId={paperComment.id} /> 
                    </div>
                </TimelineItemWrapper>
            </TimelineItem>
        </div>
    )

}

export default PaperCommentEvent
