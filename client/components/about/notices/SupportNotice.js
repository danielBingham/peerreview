import React, { useState, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { XCircleIcon } from '@heroicons/react/solid'

import { postSettings, patchSetting, cleanupRequest } from '/state/settings'

import './SupportNotice.css'

const SupportNotice = function(props) {
    const [ isClosed, setIsClosed ] = useState(false)
    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.settings.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const settings = useSelector(function(state) {
        return state.authentication.settings
    })

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

    useLayoutEffect(function() {
        if ( settings && settings.fundingDismissed) {
            setIsClosed(true)
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }
    }, [ settings ])

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
