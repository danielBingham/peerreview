import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'

import { postOrcidAuthentication, cleanupRequest } from '/state/authentication'
import { initializeReputation, cleanupReputationRequest } from '/state/reputation'

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
    const location = useLocation()
    const connect = location.pathname == '/orcid/connect'

    // Retreive the code from the search params and send it to the backend for
    // authentication.
    useEffect(function() {
        const code = searchParams.get('code')

        if ( ! code ) {
            throw new Error('Did not get a code back!')
        }

         setRequestId(dispatch(postOrcidAuthentication(code, connect)))
    }, [])

    useEffect(function() {
        if ( currentUser && request && request.state == 'fulfilled') {
            if ( request.result.type == 'connection' || request.result.type == 'registration') {
                navigate("/reputation/initialization", { replace: false, state: { connect: true } })
            } else {
                if ( location.pathname == '/orcid/connect') {
                    navigate("/account/details")
                } else  {
                    navigate("/")
                }
            }
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


    // ======= Render ===============================================

    // Initialize with the pending content.
    let content = (
        <>
            Authenticating you from your ORCID record...
            <Spinner local={true} />
        </>
    )

    // ==============================================================
    // Error Handling
    // ==============================================================
    if ( request && request.state == 'failed') {
        if ( request.error == 'no-visible-email' ) {
            content = ( 
                <div className="error">
                    <p>There was no email on your ORCID record that we have
                        permission to see through the public API.  This can
                        happen if you haven't added an email to your ORCID
                        record or if you restrict the visibility on your ORCID
                        record to either "only me" (the default for emails) or
                        "trusted accounts" (which requires us to pay a
                        membership fee to access).  </p>
            
                <p>If you'd still like to register and connect your ORCID
                    record to your account so that you can login with ORCID in
                    the future, then fill out and submit our <Link
                    to="/register">registration form</Link>.  After you've
                    regsitered, edit your profile and go to your "Account
                    Details" page.  From there you'll be able to connect your
                    ORCID record to your account with out making your emails
                    visible on your ORCID record.</p>
            </div> 
            )
        } else if ( request.error == 'unauthorized' ) {
            content = (
                <div className="error">
                    We failed to retreive an authorization token from ORCID.
                    This can happen for a number of reasons, it probably isn't
                    fatal.  We recommend going back to where you started,
                    refreshing, and trying again.  If you still get this
                    message, file a bug report and we'll look into it.
                </div>
            )

        } else if (request.error == 'already-linked' ) {
            content = (
                <div className="error">
                    You've already linked that ORCID iD to an account.  You
                    cannot link it to another account.  If you created multiple
                    accounts in error, please reach out to use at
                    <a href="mailto:contact@peer-review.io">contact@peer-review.io</a>.
                </div>
            )
        
        } else {
            content = request.error
        }
    }

    // ==============================================================
    // Success!
    // ==============================================================
    if ( request && request.state == 'fulfilled') {
        if ( currentUser ) {
                let successMessage = ''
                if ( connect ) {
                    successMessage = `We've successfully connected your ORCID record to your account.`
                } else {
                    successMessage = `We've successfully authenticated your ORCID iD and logged you in.`
                }

                content = (
                    <div className="success">
                        Welcome, { currentUser.name}!  {successMessage}  <br />
                        You will be redirected to the { connect ? 'settings page' : 'home page' } momentarily.
                    </div>
                )
        } else {
            throw new Error('Request fulfilled with no currentUser!')
        }
    } 

    // Render the component
    return (
        <div className="orcid-authentication page">
            { content }
        </div>
    )

}

export default OrcidAuthenticationPage
