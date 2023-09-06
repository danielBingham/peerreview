import React from 'react'
import {  useSelector } from 'react-redux'

import EditorControls from '/components/papers/view/controls/EditorControls'
import JournalSubmissionButton from '/components/papers/view/controls/JournalSubmissionButton'
import PreprintSubmissionButton from '/components/papers/view/controls/PreprintSubmissionButton'
import UploadNewVersionButton from '/components/papers/view/controls/UploadNewVersionButton'
import StartReviewButton from '/components/papers/view/controls/StartReviewButton'
import PaperVersionSelector from '/components/papers/view/controls/PaperVersionSelector'
import Button from '/components/generic/button/Button'

import './PaperControlView.css'

/**
 * Renders the control panel for the review screen.
 *
 * Assumptions:
 *  - paper already exists in the store
 *
 * @param {Object} props    Standard react props object.
 * @param {Object} props.paperId The id of the draft paper we're rendering controls for.
 */
const PaperControlView = function({ paperId }) {

    // ================= Request Tracking =====================================

   
    // ================= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const isAuthor = (currentUser && paper.authors.find((a) => a.userId == currentUser.id) ? true : false)
    const isOwner = (currentUser && isAuthor && paper.authors.find((a) => a.userId == currentUser.id).owner ? true : false)

    // ================= User Action Handling  ================================


    // ======= Effect Handling ======================================


    // ======= Render ===============================================
   
    const viewOnly = ! paper.isDraft
    
    let contents = ''
     if ( ! viewOnly && isAuthor && isOwner ) {
         contents = (
             <div className="author-controls">
                 <UploadNewVersionButton id={paperId} />
                 <PreprintSubmissionButton id={paperId} /> 
                 <JournalSubmissionButton id={paperId} /> 
             </div>
        )
     }

    return (
        <div className="paper-controls">
            <StartReviewButton id={paperId} /> 
            <EditorControls paperId={paperId} />
            { contents }
        </div>
    )

}

export default PaperControlView
