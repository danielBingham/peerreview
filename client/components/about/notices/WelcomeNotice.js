import React, { useState, useEffect, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { XCircleIcon } from '@heroicons/react/24/solid'
import { InformationCircleIcon } from '@heroicons/react/24/solid'
import ReactMarkdown from 'react-markdown'

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
                <h2>Welcome to Peer Review!</h2>
                <ReactMarkdown>
                    {`
Peer Review is an [open source](https://github.com/danielbingham/peerreview), diamond open access (free to access, free to
publish), non-profit scholarly publishing platform. It enables crowdsourced peer review
and public dissemination of scientific and academic papers. 
                    
Review is separated into pre-publish editorial review, focused on helping
authors improve their work, and post-publish refereeing, focused on maintaining
the integrity of the literature.  A reputation system is used to ensure that
review and refereeing is done by qualified peers. To learn more, please read
[how it works](/about#how-it-works).
                    
Our goal is to replace the scientific journal system with a web platform that
is democratically managed by scholars for scholars and open to its core.  We
hope to solve any number of problems plaguing scientific publishing in the
process, but we're starting with the file drawer problem. To learn more about
our reasoning and the problems we hope to solve, read [our
rationale](/about#rationale).
`}
                </ReactMarkdown>
            </div>
        )
    } else {
        return (null) 
    }
}

export default WelcomeNotice
