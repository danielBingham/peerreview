import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams, Link } from 'react-router-dom'

import DateTag from '/components/DateTag'

import SubmissionControls from '/components/journals/widgets/SubmissionControls'
import DraftPapersListItemView from '/components/papers/list/DraftPapersListItemView'

import './JournalSubmissionsListItem.css'

/**
 * Render a list of draft papers belonging to the logged in user.
 * 
 * Must be logged in to view.
 *
 * TODO Refactor this to render drafts of papers and to take a query in props
 * so that we can reuse it for both the "reviews" page and the "my drafts"
 * page.
 *
 * @param {object} props    Standard react props object - empty.
 */
const JournalSubmissionsListItem = function({ submissionId }) {

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    const submission = useSelector(function(state) {
        if ( state.journalSubmissions.dictionary[submissionId] ) {
            return state.journalSubmissions.dictionary[submissionId]
        } else {
            return null
        }
    })

    const paper = useSelector(function(state) {
        if ( submission && state.papers.dictionary[submission.paperId] ) {
            return state.papers.dictionary[submission.paperId]
        } else {
            return null
        }
    })

    // ======= Effect Handling ======================================

    // ====================== Render ==========================================

    return (
        <div className="journal-submission" key={submission.id}>
            <DraftPapersListItemView paper={paper} />
            <div className="submission-controls-wrapper">
                <SubmissionControls submissionId={submission.id} />
            </div>
        </div>
    )

}

export default JournalSubmissionsListItem 
