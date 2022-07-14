import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchAuthentication, cleanupRequest as cleanupAuthenticationRequest } from '/state/authentication'
import { patchUser, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'

import './ChangePasswordForm.css'

const ChangePasswordForm = function(props) {

    // ======= Render State =========================================

    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [oldPassword, setOldPassword] = useState('')

    // ======= Request Tracking =====================================

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const [ authRequestId, setAuthRequestId] = useState(null)
    const authRequest = useSelector(function(state) {
        if ( authRequestId ) {
            return state.authentication.requests[authRequestId]
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

        // Passwords must match.
        if (newPassword != confirmNewPassword ) {
            return
        }
        setAuthRequestId(dispatch(patchAuthentication(currentUser.email, oldPassword)))

    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( authRequest && authRequest.state == 'fulfilled') {
            if ( authRequest.status == 200 ) {
                const user = {
                    id: currentUser.id,
                    password: newPassword
                }

                setRequestId(dispatch(patchUser(user)))
            }
        }
    }, [ authRequest ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( authRequestId ) {
                dispatch(cleanupAuthenticationRequest({ requestId: authRequestId }))
            }
        }
    }, [ authRequestId ])


    // ======= Render ===============================================

    let submit = null
    if ( ( request && request.state == 'in-progress') || (authRequest && authRequest.state == 'in-progress') ) {
        submit = ( <Spinner /> )
    } else {
        submit = ( <input type="submit" name="submit" value="Change Password" /> )
    }

    let confirmPasswordError = null
    if ( newPassword !== confirmNewPassword) {
        confirmPasswordError = (<div className="password-mismatch-error">Your passwords must match!</div>)
    }

    let oldPasswordError = null
    if ( authRequest && authRequest.state == 'fulfilled' && authRequest.status != 200) {
        oldPasswordError = ( 
            <div className="authentication-failure">
                Authentication failed.  Make sure you typed your old password correctly.
            </div>
        )
    } else if ( authRequest && authRequest.state == 'failed' ) {
        oldPasswordError = ( 
            <div className="authentication-failure">
                Authentication failed.  Make sure you typed your old password correctly.
            </div>
        )
    }

    let result = null
    if ( request && request.state == 'fulfilled' ) {
        result = (
            <div className="success">
                Password successfully updated!
            </div>
        )
    } else if ( request && request.state == 'failed' ) {
        result = (
            <div className="request-failure">
                Something went wrong with the attempt to update your password.  Please try again.<br />
                If the error persists, please report a bug.
            </div>
        )
    }

    return (
        <div className="change-password-form">
            <form onSubmit={onSubmit}>
                <h2>Change Password</h2>
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
                <div className="form-field old-password">
                    <label htmlFor="old password">Old Password</label>
                    <input type="password"
                        name="old-password"
                        value={oldPassword}
                        onChange={(event) => setOldPassword(event.target.value)}
                    />
                    <div className="error">{ oldPasswordError }</div>
                </div>
                <div className="result">
                    { result }
                </div>
                <div className="submit">
                    { submit }                    
                </div>
            </form>
        </div>   
    )
}

export default ChangePasswordForm
