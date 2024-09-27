import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { postJournalSubmissions, cleanupRequest } from '/state/journalSubmissions'
import { patchPaperVersion, cleanupRequest as cleanupPaperVersionRequest } from '/state/paperVersions'

import Button from '/components/generic/button/Button'
import Modal from '/components/generic/modal/Modal'

import JournalSelectionInput from '/components/papers/draft/submit/JournalSelectionInput'
import JournalTag from '/components/journals/JournalTag'

import './JournalSubmissionButton.css'

/**
 * Render a button allowing a private draft to be submitted as a preprint.
 *
 * @param {Object} props    Standard react props object.
 * @param {Object} props.id The id of the draft paper we're rendering controls for.
 */
const JournalSubmissionButton = function({ id }) {

    // ================= Render State =========================================

    const [ modalIsVisible, setModalIsVisible] = useState(false)
    const [ selectedJournalId, setSelectedJournalId] = useState(null)

    // ================= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.journalSubmissions.requests[requestId]
        }
    })

    const [ patchPaperVersionRequestId, setPatchPaperVersionRequestId ] = useState(null)
    const patchPaperVersionRequest = useSelector(function(state) {
        if ( ! patchPaperVersionRequestId ) {
            return null
        } else {
            return state.paperVersions.requests[patchPaperVersionRequestId]
        }
    })
   
    // ================= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[id]
    })

    const submissions = useSelector(function(state) {
        const allSubmissions = Object.values(state.journalSubmissions.dictionary)
        return allSubmissions.filter((s) => s.paperId == paper.id)
    })

    const mostRecentVersion = useSelector(function(state) {
        const mostRecentVersionId = state.paperVersions.mostRecentVersion[paper.id]
        return state.paperVersions.dictionary[mostRecentVersionId]
    })

    const isAuthor = (currentUser && paper.authors.find((a) => a.userId == currentUser.id) ? true : false)
    const isOwner = (currentUser && isAuthor && paper.authors.find((a) => a.userId == currentUser.id).owner ? true : false)

    // ================= User Action Handling  ================================

    const dispatch = useDispatch()

    const submitToJournal = function() {
        const submission = { paperId: paper.id}
        setRequestId(dispatch(postJournalSubmissions(selectedJournalId, submission)))

        addToSubmission()
    }

    const addToSubmission = function() {
        const paperVersionPatch = {
            id:  mostRecentVersion.id,
            paperId: id,
            isSubmitted: true
        }

        setPatchPaperVersionRequestId(dispatch(patchPaperVersion(id, paperVersionPatch)))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId}))
            }
        }
    }, [ requestId ])

    useEffect(function() {
        return function cleanup() {
            if ( patchPaperVersionRequestId ) {
                dispatch(cleanupPaperVersionRequest({ requestId: patchPaperVersionRequestId}))
            }
        }
    }, [ patchPaperVersionRequestId ])

    // ======= Render ===============================================
  
    let activeSubmission = false
    if ( submissions.length && submissions.find((s) => s.status !== 'rejected') ) {
        activeSubmission = true
    }

    if ( isOwner && paper.isDraft && ! activeSubmission ) {
        return (
            <>
                <Button onClick={(e) => setModalIsVisible(true)} type="primary">Submit to Journal</Button>
                <Modal className="journal-submission-modal" isVisible={modalIsVisible} setIsVisible={setModalIsVisible}>
                    <h2>Select a Journal for Submission</h2>
                    <div className="explanation">Select a journal to submit this paper to.</div>
                    <div className="selected">
                        { selectedJournalId && <JournalTag id={selectedJournalId} onRemove={(e) => setSelectedJournalId(null)} /> }
                    </div>
                    { ! selectedJournalId && <JournalSelectionInput 
                        selectedJournalId={selectedJournalId}
                        setSelectedJournalId={setSelectedJournalId}
                    /> }
                    <Button type="secondary-warn" onClick={(e) => setModalIsVisible(false)}>Cancel</Button> 
                    <Button type="primary-highlight" disabled={ selectedJournalId ? false : true } onClick={(e) => submitToJournal()}>Submit to Journal</Button> 
                </Modal>
            </>
        )
    } else if ( isOwner && paper.isDraft && activeSubmission && ! mostRecentVersion.isSubmitted ) {
        return (
            <Button onClick={(e) => addToSubmission()} type="primary">Add to Submission</Button>
        )
    } else {
        return null
    }
}

export default JournalSubmissionButton
