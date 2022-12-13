import React, { useState, useEffect, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { XCircleIcon } from '@heroicons/react/24/solid'
import ReactMarkdown from 'react-markdown'

import { postSettings, patchSetting, cleanupRequest } from '/state/settings'

import './SupportNotice.css'

/**
 * Show a notice asking users for support.
 *
 * @param {object} props    React props object - empty.
 */
const SupportNotice = function(props) {

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
     * Close the notice and record the closure either in the users settings or
     * session, depending on whether or not we have a logged in user.
     *
     * @param {Event} event Standard javascript event object.
     */
    const close = function(event) {
        setIsClosed(true)

        if ( currentUser && settings) {
            const newSettings = {
                fundingDismissed: true
            }
            newSettings.userId = currentUser.id
            newSettings.id = settings.id
            setRequestId(dispatch(patchSetting(newSettings)))
        } else {
            let newSettings = {}
            if ( settings ) {
                newSettings = { ...settings }
            }
            newSettings.fundingDismissed = true
            setRequestId(dispatch(postSettings(newSettings)))
        }
    }

    // ======= Effect Handling ======================================

    // Initialize our closed state from the user's settings.
    useLayoutEffect(function() {
        if ( settings && settings.fundingDismissed) {
            setIsClosed(true)
        }
    }, [ settings ])

    // Cleanup our requests when we're done with them.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({requestId: requestId}))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================
    
    if ( ! isClosed ) {
        return (
            <div className="support-notice">
                <div className="close" onClick={close}><XCircleIcon /></div>
                <h2>We Need Your Support</h2>
                <ReactMarkdown>
                    {`
Peer Review is currently being developed and maintained by a single developer as a
side project.  Donations help support running the infrastructure. If we raise
enough donations, then we can hire folks to work on it full time. 

If you want the experiment to succeed, please consider 
[supporting us](https://github.com/sponsors/danielBingham) through Github Sponsors!
`}
                </ReactMarkdown>
            </div>
        )
    } else {
        return (null)
    }
}

export default SupportNotice
