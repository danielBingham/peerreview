import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {  patchPaper, cleanupRequest } from '/state/papers'

import Button from '/components/generic/button/Button'

import './PreprintSubmissionButton.css'

/**
 * Render a button allowing a private draft to be submitted as a preprint.
 *
 * @param {Object} props    Standard react props object.
 * @param {Object} props.id The id of the draft paper we're rendering controls for.
 */
const PreprintSubmissionButton = function({ id }) {

    // ================= Request Tracking =====================================
    
    const [ patchPaperRequestId, setPatchPaperRequestId ] = useState(null)
    const patchPaperRequest = useSelector(function(state) {
        if ( ! patchPaperRequestId ) {
            return null
        } else {
            return state.papers.requests[patchPaperRequestId]
        }
    })
   
    // ================= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[id]
    })

    const isAuthor = (currentUser && paper.authors.find((a) => a.userId == currentUser.id) ? true : false)
    const isOwner = (currentUser && isAuthor && paper.authors.find((a) => a.userId == currentUser.id).owner ? true : false)

    // ================= User Action Handling  ================================

    const dispatch = useDispatch()

    const submitPreprint = function() {
        const paperPatch = {
            id: id,
            showPreprint: true
        }

        setPatchPaperRequestId(dispatch(patchPaper(paperPatch)))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        return function cleanup() {
            if ( patchPaperRequestId ) {
                dispatch(cleanupRequest({ requestId: patchPaperRequestId}))
            }
        }
    }, [ patchPaperRequestId ])

    // ======= Render ===============================================
   

    if ( isOwner && paper.isDraft && ! paper.showPreprint ) {
        return (
             <Button onClick={submitPreprint} type="secondary">Submit Preprint</Button>
        )
    } else {
        return null
    }
}

export default PreprintSubmissionButton
