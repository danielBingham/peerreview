import React, { useEffect, useState} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'

import { initializeReputation, cleanupRequest} from '/state/reputation'

import Spinner from '/components/Spinner'

import './ReputationInitializationPage.css'

const ReputationInitializationPage = function(props) {

    const [requestId,  setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.reputation.requests[requestId]
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

    useEffect(function() {
         setRequestId(dispatch(initializeReputation(currentUser.id)))         
    }, [])

    useEffect(function() {
        if ( request && request.state == 'fulfilled') {
            if ( location.state.connect ) {
                navigate("/account/details")
            } else  {
                navigate("/")
            }
        }
    }, [ request ])

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
        <div className="initializing-reputation">
            We're now attempting to initialize your reputation
            using your ORCID iD record and OpenAlex.<br />
            <br />
            This could take a moment, especially if you have a lot
            of published works.  We'll redirect you to the homepage
            when we're done!<br />
            <Spinner local={true} />
        </div>
    )

    // ========== Reputation Request Failed =======================
    if ( request && request.state == 'failed' ) {

        // They aren't logged in, or someone hit the API endpoint with out including the user id.
        // The former error shouldn't ever bit hit from this page, but we'll handle it anyway.
        if ( request.error == 'userid-is-required' || request.error == 'not-authenticated' ) {
            content = (
                <div className="error">
                   You don't seem to be logged in.  You cannot initialize your reputation with out being logged in. 
                </div>
            )
        } 
        // They somehow called the endpoint with a different user than they
        // have authenticated as.  This is an error we should never hit
        // from this page, but we'll handle it anyway.
        else if ( request.error == 'not-authorized:wrong-user' ) {
            content = (
                <div className="error">
                    You appear to be attempting to initialize someone else's reputation.  That's not allowed.
                </div>
            )
        } 
        // There was no ORCID iD on their record.  This can happen if they
        // navigate to this page with out going through the ORCID
        // authentication flow.  
        else if ( request.error == 'no-orcid' ) {
            content = (
                <div className="error">
                    <p> 
                        We couldn't find an ORCID iD on your user record.  You
                        must have an ORCID iD linked to your account in order
                        to initialize your reputation. 
                    </p>
                    <p>
                        If you would like to initialize your reputation, please
                        go to your Settings Page and connect your ORCID iD to
                        this account by authenticating with ORCID.
                    </p>
                </div>
            )
        } 
        // One of our requests to OpenAlex failed for some reason.  Logs should
        // give more details.
        else if ( request.error == 'server-error:api-connection' ) {
            content = (
                <div className="error">
                    <p>
                        Something went wrong with our attempt to connect to
                        OpenAlex on the backend.  We're not sure what.
                        OpenAlex may be down, or something might have gone
                        wrong with our backend.  Please wait a little while and
                        try again.  You can try again by just refreshing this
                        page.
                    </p>
                    <p>
                        If this error persists, please report a bug by
                        contacting <a
                        href="mailto:contact@peer-review.io">contact@peer-review.io</a>,
                        or by visting our <a
                        href="https://github.com/danielbingham/peerreview">Github</a>
                        and creating an Issue.
                    </p>
                </div>
            )
        }

        // We weren't able to find an OpenAlex Author record attached to that
        // ORCID iD.
        else if ( request.error == 'no-openalex-record' ) {
            content = (
                <div className="error">
                    <p>
                        We were unable to find an OpenAlex author record for
                        your ORCID iD.  This could happen for any number of
                        reasons.  OpenAlex has a very large dataset, but they
                        don't have access to everything.  Right now, OpenAlex
                        and ORCID iD are our only way to initialize reputation.
                        If you'd like to get initial reputation, please reach
                        out to OpenAlex and work with them to attach your ORCID
                        iD to your body of existing work.
                    </p>
                    <p>
                        Once your ORCID iD is associated with your OpenAlex
                        record, you can return to this page to initialize your
                        reputation.  In the meantime, you can use the site with
                        out initial reputation.
                    </p>
                </div>
            )
        }

        else if ( request.error == 'multiple-openalex-record' ) {
            content = (
                <div className="error">
                    <p>
                        We found multiple OpenAlex author records attached to
                        your ORCID iD.  Please work with OpenAlex to
                        consolidate your author records down to a single
                        record.
                    </p>
                </div>
            )
        }

        else {
            content = (
                <div className="error">
                    { request.error }
                </div>
            )
        }
    }

    // ========== Reputation Request Succeeded ====================
    if ( request && request.state == 'fulfilled' ) {
        content = (
            <div className="success">
                We have successfully initialized your reputation!<br />
                You'll be redirected to the homepage shortly.
            </div>
        )
    }

    // Render the component
    return (
        <div className="orcid-authentication page">
            { content }
        </div>
    )
}

export default ReputationInitializationPage
