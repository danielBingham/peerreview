import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { createToken, cleanupRequest } from '/state/authentication'

import Spinner from '/components/Spinner'
import { Page, PageBody } from '/components/generic/Page'

import './ResetPasswordRequestPage.css'

const ResetPasswordRequestPage = function(props) {
    const [ email, setEmail ] = useState('')
    const [ submitted, setSubmitted ] = useState(false)

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.authentication.requests[requestId]
        } else {
            return null
        }
    })


    const dispatch = useDispatch()

    function onSubmit(event) {
        event.preventDefault()

        setRequestId(dispatch(createToken({ type: 'reset-password', email: email })))
        setSubmitted(true)
    }

    let content = ( <Spinner local={true} /> )
    // If they've submitted the request.
    if ( submitted ) {
        if ( request && request.state == 'fulfilled' ) {
            content = (
                <span className="success">
                    Link sent.  Check your email.  If the email does not arrive
                    shortly, you can refresh this page to request another one.
                </span>
            )
        } else if ( request && request.state == 'failed' ) {
            content = (
                <div className="error">
                    Something went wrong: { request.error }
                </div>
            )
        }
    }

    // Otherwise, render the form.
    else {
        content = (
            <>
                <h1>Password Reset Request</h1>
                <p>
                    Please enter your email address to request a password reset
                    link.  A link will be sent to the address you provide. To reset
                    your password, click the link in the email.  You will be taken
                    back here and able to enter a new password.
                </p>
                <form onSubmit={onSubmit}>
                    <label htmlFor="reset-password-request">Email</label><input type="text" name="email" onChange={(e) => setEmail(e.target.value) } />
                    <input type="submit" name="submit" value="Request Password Reset Link" />
                </form>
            </>
        )

    }

    return (
        <Page id="reset-password-request">
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )

}

export default ResetPasswordRequestPage
