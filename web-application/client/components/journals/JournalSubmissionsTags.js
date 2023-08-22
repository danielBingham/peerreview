import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getPaper, getPaperSubmissions, cleanupRequest } from '/state/papers'

import JournalTag from '/components/journals/JournalTag'
import Spinner from '/components/Spinner'

import './JournalSubmissionsTags.css'

const JournalSubmissionsTags = function(props) {

    // ======= Request Tracking =====================================
    
    const [ paperRequestId, setPaperRequestId ] = useState(null)
    const paperRequest = useSelector(function(state) {
        return state.papers.requests[paperRequestId]
    })

    // ======= Redux State ==========================================
    
    const paper = useSelector(function(state) {
        if ( state.papers.dictionary[props.id] ) {
            return state.papers.dictionary[props.id]
        } else {
            return null
        }
    })

    const submissions = useSelector(function(state) {
        const allSubmissions = Object.values(state.journalSubmissions.dictionary)
        return allSubmissions.filter((s) => s.paperId == paper.id)
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        setPaperRequestId(dispatch(getPaper(props.id)))
    }, [ ])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( paperRequestId ) {
                dispatch(cleanupRequest({ requestId: paperRequestId }))
            }
        }
    }, [ paperRequestId])

    // ======= Render ===============================================
  
    let content = [] 

    if ( paper.isDraft && paper.showPreprint ) {
        content.push( <div key={'preprint'} className="preprint-tag">Preprint</div> )
    } else if ( paper.isDraft ) {
        content.push( <div key={'private-draft'} className="private-draft-tag">Private Draft</div> )
    }
    
    if ( paper ) {
        if ( submissions && submissions.length) {
            for(const submission of submissions) {
                if ( submission.status !== 'rejected' ) {
                    content.push(
                        <JournalTag key={submission.id} paper={paper} submission={submission} />
                    )
                }
            }
        }
    }

    return (
        <div className="journal-submissions-tags">
            { content }
        </div>

    )

}

export default JournalSubmissionsTags 
