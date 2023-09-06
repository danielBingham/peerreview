import React from 'react'
import { useSelector } from 'react-redux'

import { ButtonWithModal, ModalButton, ButtonModal } from '/components/generic/button-with-modal/ButtonWithModal'

import ReviewDecisionControls from '/components/reviews/widgets/ReviewDecisionControls'
import SubmissionControls from '/components/journals/widgets/SubmissionControls'

import './EditorControls.css'

const EditorControls = function({ paperId }) {

    // ================= Redux State ==========================================
    
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

    const journalDictionary = useSelector(function(state) {
        const dictionary = {}
        for(const submission of submissions) {
            dictionary[submission.journalId] = state.journals.dictionary[submission.journalId]
        }
        return dictionary
    })

    const submission = submissions?.find(
        (s) => ( 
            currentUser?.memberships.find( 
                (m) => (m.permissions == 'owner' || m.permissions == 'editor') && s.journalId == m.journalId
            ) ? true : false 
        )
    ) 
    return (
        <>
            { submission && <ButtonWithModal className="editor-controls">
                <ModalButton type="primary">Editor Controls</ModalButton>
                <ButtonModal className="editor-controls-modal"> 
                    <div className="header">Editing for { journalDictionary[submission.journalId].name }</div>
                    <SubmissionControls submissionId={submission.id} />
                    <ReviewDecisionControls submission={submission} />
                </ButtonModal>
            </ButtonWithModal> }
        </>
    )

}

export default EditorControls
