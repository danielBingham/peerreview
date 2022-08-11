import React, { useState, useEffect, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { XCircleIcon } from '@heroicons/react/solid'

import { postSettings, patchSetting, cleanupRequest }  from '/state/settings'

import './WelcomeNotice.css'

/**
 * Show a notice welcoming the user to Peer Review, giving a short explanation
 * of what it is, and linking them to more documentation.
 *
 * @param {object} props    Standard react props - empty.
 */
const WelcomeNotice = function(props) {

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
                welcomeDismissed: true
            }
            newSettings.userId = currentUser.id
            newSettings.id = settings.id
            setRequestId(dispatch(patchSetting(newSettings)))
        } else {
            let newSettings = {}
            if ( settings ) { 
                newSettings =  { ...settings }
            }
            newSettings.welcomeDismissed = true
            setRequestId(dispatch(postSettings(newSettings)))
        } 
    }

    // ======= Effect Handling ======================================

    // Initialize the state from the user's settings.
    useLayoutEffect(function() {
        if ( settings && settings.welcomeDismissed ) {
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
            <div className="welcome-notice">
                <div className="close" onClick={close}><XCircleIcon /></div>
                <p>
                    Welcome to Peer Review!  Peer Review is an open source, diamond
                    open access (free to access, free to publish) scientific
                    publishing repository.  You can submit your papers here to be
                    peer reviewed and published.
                </p>  

                <p>
                    The peer review process is self selected, using a
                    reputation system to ensure that only knowledgeable peers
                    are offering reviews. Review is split into two pieces:
                    pre-publish editorial review and post publish refereeing.
                    The first is visible only to peers in your field, the
                    second is public. To learn more, please read <a
                    href="/about#how-it-works">how it works</a>.
                </p>

                <p>
                    Our goal is to replace the scientific journal system with
                    something open, scholar lead, and community managed.  We hope
                    to solve any number of problems plauging scientific publishing
                    in the process, but we're starting with the file drawer
                    problem. To learn more about our reasoning and the
                    problems we hope to solve, read <Link to="/about#rationale">our
                    rationale</Link>.
                </p>
            </div>
        )
    } else {
        return (null) 
    }
}

export default WelcomeNotice
