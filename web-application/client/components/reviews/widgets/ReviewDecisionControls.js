import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { patchJournalSubmission, cleanupRequest } from '/state/journalSubmissions'
import { patchPaper, cleanupRequest as cleanupPaperRequest } from '/state/papers'

import Button from '/components/generic/button/Button'

import Spinner from '/components/Spinner'
import Error404 from '/components/Error404'

import './ReviewDecisionControls.css'

const ReviewDecisionControls = function(props) {

    const [ decisionComment, setDecisionComment ] = useState('')

    // ================= Request Tracking =====================================
    
    const [ requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
           return state.journalSubmissions.requests[requestId]
        }
    })

    const [ paperRequestId, setPaperRequestId ] = useState(null)
    const paperRequest = useSelector(function(state) {
        if ( ! paperRequestId ) {
            return null
        } else {
            return state.papers.requests[paperRequestId]
        }
    })

    // ================= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    // ================= User Action Handling  ================================
    
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const makeDecision = function(decision) {
        // `deciderId` will be set from the session on the backend.
        const submissionPatch = {
            id: props.submission.id,
            status: decision,
            decisionComment: decisionComment
        }

        setRequestId(dispatch(patchJournalSubmission(props.submission.journalId, submissionPatch)))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    // ================= Render ===============================================
    

    return (
        <div className="decision-controls">
            <div>
                <textarea
                    value={decisionComment}
                    placeholder="Describe your publication decision..."
                    onChange={(e) => setDecisionComment(e.target.value)}
                >
                </textarea> 
            </div>
            <div className="decision">
                <Button type="primary-warn" onClick={(e) => makeDecision('rejected')}>Reject</Button> 
                <Button type="primary-highlight" onClick={(e) => makeDecision('published')}>Publish</Button>
            </div>
        </div>
    )

}

export default ReviewDecisionControls 
