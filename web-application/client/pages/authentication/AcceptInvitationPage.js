import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { validateToken, cleanupRequest } from '/state/authentication'

import Spinner from '/components/Spinner'
import { Page, PageBody } from '/components/generic/Page'
import AcceptInvitationForm from '/components/authentication/AcceptInvitationForm'

import './AcceptInvitationPage.css'

const AcceptInvitationPage = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.authentication.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const dispatch = useDispatch()
    const navigate = useNavigate()

    useEffect(function() {
        const token = searchParams.get('token')

        // If we have a user already logged in, or don't have a token, bail
        // out.
        if ( ! token ) {
            navigate("/")
        }

        setRequestId(dispatch(validateToken(token, 'invitation')))
    }, [ searchParams ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    let content = ( <Spinner local={true} /> )

    if ( request && request.state == 'fulfilled' ) {
        content = (
            <AcceptInvitationForm />
        )
    } else if ( request && request.state == 'failed' ) {
        content = (
            <div className="error">
                <p>Invalid token.  Something may have gone wrong on our end.</p>
                <p>
                    If you did get here following a valid invitation, please
                    reach out to us at <a
                    href="mailto:contact@peer-review.io">contact@peer-review.io</a>.
                    You won't be able to register on the email you were invited
                    with, so we'll need to get things sorted out.
                </p>
            </div>
        )
    }

    return (
        <Page id="accept-invitation-page">
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )

}

export default AcceptInvitationPage
