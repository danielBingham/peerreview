import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams, useNavigate } from 'react-router-dom'

import { postOrcidAuthentication, cleanupRequest } from '/state/authentication'

import Spinner from '/components/Spinner'

const OrcidAuthenticationPage = function(props) {
    const [searchParams, setSearchParams ] = useSearchParams()

    // ======= Request Tracking =====================================
    
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if (requestId) {
            return state.authentication.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser 
    })

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch()
    const navigate = useNavigate()

    // Retreive the code from the search params and send it to the backend for
    // authentication.
    useEffect(function() {
        const code = searchParams.get('code')

        if ( ! code ) {
            throw new Error('Did not get a code back!')
        }

         setRequestId(dispatch(postOrcidAuthentication(code)))
    }, [])

    useEffect(function() {
        if ( currentUser && request && request.state == 'fulfilled') {
            setTimeout(function() {
                navigate("/")
            }, 2000)
        }
    }, [ request ])

    // Cleanup our authentication request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    let content = (
        <>
            Authenticating you from your ORCID record...
            <Spinner local={true} />
        </>
    )

    if ( request && request.state == 'fulfilled') {
        if ( currentUser ) {
            content = (
                <div className="success">
                    Welcome, { currentUser.name}!  You've have been logged in with your ORCID ID. <br />
                    You will be redirected to the home page momentarily.
                </div>
            )
        } else {
            throw new Error('Request fulfilled with no currentUser!')
        }
    } else if ( request && request.state == 'failed') {
        content = request.error
    }

    return (
        <div className="orcid-authentication page">
            { content }
        </div>
    )

}

export default OrcidAuthenticationPage
