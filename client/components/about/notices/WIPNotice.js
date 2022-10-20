import React, { useState, useEffect, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { XCircleIcon } from '@heroicons/react/24/solid'
import { InformationCircleIcon } from '@heroicons/react/24/solid'
import ReactMarkdown from 'react-markdown'

import { postSettings, patchSetting, cleanupRequest }  from '/state/settings'

import './WIPNotice.css'

/**
 * Informing the user that Peer Review is a work in progress.
 *
 * @param {object} props    Standard react props - empty.
 */
const WIPNotice = function(props) {

    // ======= Render State =========================================
    
    const [ isClosed, setIsClosed ] = useState(false)

    // ======= Request Tracking =====================================
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.settings.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const settings = useSelector(function(state) {
        return state.authentication.settings
    })

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch()

    /**
     * Close the notice and record the closure in the user's settings or
     * session.
     *
     * @param {Event} event The standard javascript event object.
     */
    const close = function(event) {
        setIsClosed(true)

        if ( currentUser && settings) {
            const newSettings = {
                wipDismissed: true
            }
            newSettings.userId = currentUser.id
            newSettings.id = settings.id
            setRequestId(dispatch(patchSetting(newSettings)))
        } else {
            let newSettings = {}
            if ( settings ) { 
                newSettings =  { ...settings }
            }
            newSettings.wipDismissed = true
            setRequestId(dispatch(postSettings(newSettings)))
        } 
    }

    // ======= Effect Handling ======================================

    // Initialize the state from the user's settings.
    useLayoutEffect(function() {
        if ( settings && settings.wipDismissed ) {
            setIsClosed(true)
        }
    }, [ settings ])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({requestId: requestId}))
            }
        }
    }, [ requestId])

    // ======= Render ===============================================
    
    if ( ! isClosed ) {
        return (
            <div className="wip-notice">
                <div className="close" onClick={close}><XCircleIcon /></div>
                <h2>Alpha Software</h2>
                <ReactMarkdown>
                    {`
Warning!  Peer Review is alpha software.  That means it is provided only for
testing purposes.  All data you enter will be deleted before we begin the
closed beta period.   

During the alpha and initial beta period, all actions (publishing, reviewing,
and refereeing) will require reputation.  We will attempt to generate initial
reputation for users who connect their ORCID iDs to their account by looking up
their record on [OpenAlex](https://openalex.org).  After the initial beta
period, publishing will require zero reputation.
                    `}
                </ReactMarkdown>
            </div>
        )
    } else {
        return (null) 
    }
}

export default WIPNotice
