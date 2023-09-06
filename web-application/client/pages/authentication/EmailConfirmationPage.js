import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams, useNavigate } from 'react-router-dom'

import { validateToken, cleanupRequest } from '/state/authentication'

import Spinner from '/components/Spinner'
import { Page, PageBody } from '/components/generic/Page'

const EmailConfirmationPage = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()


    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId) {
            return state.authentication.requests[requestId]
        } else {
            return null
        }
    })

    const dispatch = useDispatch()
    const navigate = useNavigate()

    useEffect(function() {
        const token = searchParams.get('token')

        if ( ! token ) {
            // TODO Is there a better way to handle this?
            navigate("/")
        }

        setRequestId(dispatch(validateToken(token, 'email-confirmation')))
    }, [ searchParams ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    let content = ( <Spinner /> )

    // If the request succeeded.
    if ( request && request.state == 'fulfilled' ) {
        content = (
            <div className="success">
                <p>Thanks for confirming your email!</p>
                <p>You can return to the home page <a href="/">here</a></p>
            </div>
        )
    }

    // If the request failed, handle errors.
    else if (request && request.state == 'failed' ) {
        content = (
            <div className="failure">
                <p>We were unable to confirm you email.  The token you used may have been invalid or may have expired.</p>
                <p>If you login, you can request a new token from the settings page.</p>
            </div>
        )
    }
    
    return (
        <Page id="email-confirmation">
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )

}

export default EmailConfirmationPage
