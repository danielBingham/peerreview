import React, { useState, useEffect, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { XCircleIcon } from '@heroicons/react/24/solid'

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
                <p>
                    Peer Review needs funding to support development and
                    infrastructure.  Since we're diamond open access, we're not
                    charging a fee to publish or to access.  We're counting on
                    support from the community.
                </p>

                <p>
                    If you want to see us grow to become the scholar lead
                    academic publishing community we hope to become, please
                    consider <a
                    href="https://github.com/sponsors/danielBingham">supporting
                    us</a> through Github Sponsors!
                </p>
            </div>
        )
    } else {
        return (null)
    }
}

export default SupportNotice
