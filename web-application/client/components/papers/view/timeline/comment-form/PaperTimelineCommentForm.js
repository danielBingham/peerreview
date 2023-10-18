import React  from 'react'
import { useSelector } from 'react-redux'

import { TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/generic/timeline/Timeline'

import PaperCommentForm from '/components/papers/comments/form/PaperCommentForm'
import UserProfileImage from '/components/users/UserProfileImage'
import SubmissionControls from '/components/journals/widgets/SubmissionControls'
import JournalTag from '/components/journals/JournalTag'

import './PaperTimelineCommentForm.css'

const PaperTimelineCommentForm = function({ paperId }) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const submissions = useSelector(function(state) {
        const allSubmissions = Object.values(state.journalSubmissions.dictionary)
        return allSubmissions.filter((s) => s.paperId == paper.id)
    })

    const submission = submissions?.find(
        (s) => ( 
            currentUser?.memberships.find( 
                (m) => (m.permissions == 'owner' || m.permissions == 'editor') && s.journalId == m.journalId
            ) ? true : false 
        )
    ) 

    const journalDictionary = useSelector(function(state) {
        const dictionary = {}
        for(const submission of submissions) {
            dictionary[submission.journalId] = state.journals.dictionary[submission.journalId]
        }
        return dictionary
    })

    if ( ! currentUser ) {
        return null
    }

    let showEditorControls = false 
    if ( currentUser && submission ) {
        const journal = journalDictionary[submission.journalId]

        const membership = currentUser.memberships.find((m) => m.journalId == submission.journalId)

        const isEditor =  membership && ( membership.permissions == 'owner' || membership.permissions == 'editor' ) ? true : false
        const isManagingEditor = membership && membership.permissions == 'owner' ? true : false
        const isAssignedEditor = submission.editors.find((e) => e.userId == currentUser.id) ? true : false 

        
        if ( journal.model == 'closed' && ( ! isManagingEditor && ! isAssignedEditor )) {
            showEditorControls = false 
        } else {
            showEditorControls = true 
        }
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
                    { submission && <div className="paper-timeline-editor-controls-wrapper">
                        <div className="paper-timeline-editor-controls-header">
                            <div>Edit Submission for <JournalTag id={submission.journalId} /></div>
                        </div>
                        <div className="paper-timeline-editor-controls">
                             <SubmissionControls submissionId={submission.id} /> 
                        </div>
                    </div>}
                </TimelineItemWrapper>
            </TimelineItem>
        </div>
    )

}

export default PaperTimelineCommentForm
