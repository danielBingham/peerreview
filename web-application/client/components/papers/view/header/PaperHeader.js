import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getPaper, cleanupRequest } from '/state/papers'

import JournalSubmissionsTags from '/components/journals/JournalSubmissionsTags'
import UserTag from '/components/users/UserTag'
import Field from '/components/fields/Field'
import DateTag from '/components/DateTag'
import Spinner from '/components/Spinner'
import Error404 from '/components/Error404'


import './PaperHeader.css'

/**
 * Show a draft paper and its reviews, or show the reviews from the draft stage
 * of a published paper.
 *
 * Assumptions:
 *  - Assumes we have a current user logged in.  
 * 
 * @param {Object} props    Standard react props object.
 * @param {int} props.id    The id of the draft paper we want to load and show
 * reviews for. 
 */
const PaperHeader = function({ paperId }) {
    // ================= Request Tracking =====================================

    // ================= Redux State ==========================================

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    // ======= Effect Handling =====================

    // ================= Render ===============================================
    
    // Error checking.
    if ( ! paper ) {
        throw new Error('Missing paper.')
    } 

    let authors = [] 
    for(const author of paper.authors) {
        authors.push(<UserTag key={author.userId} id={author.userId} />)
    }

    let fields = []
    for(const field of paper.fields) {
        fields.push(<Field key={field.id} id={field.id} />)
    }

    return (
        <div id={`paper-${paperId}`} className="paper-header">
            <JournalSubmissionsTags id={paper.id} />
            <h2 className="title">{paper.title}</h2>
            <div className="submitted-date">submitted <DateTag timestamp={paper.createdDate} /></div>
            <div className="authors">by {authors}</div>
            <div className="fields">{fields}</div>
        </div>
    )

}

export default PaperHeader 
