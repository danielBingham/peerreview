import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Button from '/components/generic/button/Button'
import Modal from '/components/generic/modal/Modal'

import UploadPaperVersionForm from '/components/papers/draft/version/UploadPaperVersionForm'

import './UploadNewVersionButton.css'

/**
 * Render a button allowing a private draft to be submitted as a preprint.
 *
 * @param {Object} props    Standard react props object.
 * @param {Object} props.id The id of the draft paper we're rendering controls for.
 */
const UploadNewVersionButton = function({ id }) {

    // ================= Render State =========================================

    const [ modalIsVisible, setModalIsVisible] = useState(false)

    // ================= Request Tracking =====================================
   
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

    // ======= Effect Handling ======================================

    // ======= Render ===============================================

    if ( isOwner && paper.isDraft ) {
        return (
            <>
                <Button onClick={(e) => setModalIsVisible(true)}>Upload New Version</Button>
                <Modal isVisible={modalIsVisible} setIsVisible={setModalIsVisible}>
                    <UploadPaperVersionForm paper={paper} close={() => setModalIsVisible(false)} />
                </Modal>
            </>
        )
    } else {
        return null
    }
}

export default UploadNewVersionButton
