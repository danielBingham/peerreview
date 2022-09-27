import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { patchAuthentication, cleanupRequest as cleanupAuthenticationRequest } from '/state/authentication'
import { patchUser, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'

import './ResetPasswordForm.css'

const ResetPasswordForm = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================

    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')

    // ======= Request Tracking =====================================

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const onSubmit = function(event) {
        event.preventDefault()

        // ResetPasswordPage will check to ensure we have a token.  By the time
        // we're here, we should have one.
        const token = searchParams.get('token')

        const user = {
            id: currentUser.id,
            password: newPassword,
            token: token
        }

        setRequestId(dispatch(patchUser(user)))
    }

    // ======= Effect Handling ======================================

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    // ======= Render ===============================================

    let confirmPasswordError = null
    if ( newPassword !== confirmNewPassword) {
        confirmPasswordError = (<div className="password-mismatch-error">Your passwords must match!</div>)
    }

    let content = (
        <form onSubmit={onSubmit}>
            <h2>Reset Password</h2>
            <div className="form-field new-password">
                <label htmlFor="new-password">New Password</label>
                <input type="password"
                    name="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                />
            </div>
            <div className="form-field confirm-new-password">
                <label htmlFor="confirm-new-password">Confirm New Password</label>
                <input type="password"
                    name="confirm-new-password"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                />
                <div className="error">{ confirmPasswordError } </div>
            </div>
            <div className="submit">
                <input type="submit" name="submit" value="Reset Password" />                    
            </div>
        </form>

    )

    if ( request && request.state == 'in-progress') {
        content = ( <Spinner local={true} /> )
    }

    else if ( request && request.state == 'fulfilled' ) {
        content = (
            <div className="success">
               We have logged you in and reset your password.  You can return to the homepage <a href="/">here</a>. 
            </div>
        )
    } 

    else if ( request && request.state == 'failed' ) {
        content = (
            <div className="request-failure">
                <p>
                    Something went wrong with the attempt to reset your
                    password.  You can try again by going back to the <a
                    href="/reset-password-request">reset password</a> page and
                    requesting a new link.
                </p>
                <p>
                    If the error persists, please report a bug.
                </p>
            </div>
        )
    }

    return (
        <div className="reset-password-form">
            { content }
        </div>   
    )
}

export default ResetPasswordForm
