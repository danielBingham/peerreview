import React  from 'react'
import { useSelector } from 'react-redux'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'

import PaperCommentForm from '/components/papers/comments/form/PaperCommentForm'
import UserProfileImage from '/components/users/UserProfileImage'

import './PaperTimelineCommentForm.css'

const PaperTimelineCommentForm = function({ paperId }) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    if ( ! currentUser ) {
        return null
    }

    return (
        <div className="paper-timeline-comment-form">
            <TimelineItem>
                <TimelineIcon>
                    <UserProfileImage userId={currentUser.id} />
                </TimelineIcon>
                <TimelineItemWrapper>
                    <div className="paper-timeline-comment-form-wrapper">
                        <PaperCommentForm paperId={paperId} />
                    </div>
                </TimelineItemWrapper>
            </TimelineItem>
        </div>
    )

}

export default PaperTimelineCommentForm
