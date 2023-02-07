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

    const [newPasswordError, setNewPasswordError] = useState(null)
    const [newPasswordConfirmationError, setNewPasswordConfirmationError] = useState(null)

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

    /**
     * Perform validation on our state and return a boolean indicating whether
     * our current state is valid.
     *
     * @param {string} field    (Optional) When included, we'll only validate
     * the named field.  If excluded, we'll validate all fields.
     *
     * @return {boolean}    True if our state (or the named field) is valid,
     * false otherwise.
     */
    const isValid = function(field) {
        let error = false 

        if ( ! field || field == 'newPassword' ) {
            if ( ! newPassword || newPassword.length == 0 ) {
                setNewPasswordError('no-password')
                error = true
            } else if ( newPassword.length < 16 ) {
                setNewPasswordError('password-too-short')
                error = true
            } else if ( newPassword.length > 256 ) {
                setNewPasswordError('password-too-long')
                error = true
            } else {
                setNewPasswordError(null)
            }
        }

        if ( ! field || field =='confirmNewPassword' ) {
            if (newPassword != confirmNewPassword) {
                setNewPasswordConfirmationError('password-mismatch')
                error = true 
            } else {
                setNewPasswordConfirmationError(null)
            }
        }

        return ! error
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
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
                    password: newPassword,
                    oldPassword: oldPassword
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

    let newPasswordErrorView = null
    if ( newPasswordError == 'no-password' ) {
        newPasswordErrorView = (<div className="error">New password required to change your password.</div> )
    } else if ( newPasswordError == 'pasword-too-short' ) {
        newPasswordErrorView = (<div className="error">Your new password must be at least 16 characters long.</div>)
    } else if ( newPasswordError == 'password-too-long' ) {
        newPasswordErrorView = (<div className="error">Your new password is too long. Limit is 256 characters.</div>)
    }

    let confirmPasswordErrorView = null
    if ( newPasswordConfirmationError && newPasswordConfirmationError == 'password-mismatch' ) {
        confirmPasswordErrorView = (<div className="error">Your passwords must match!</div>)
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
    if ( authRequest && authRequest.state == 'fulfilled' && request && request.state == 'fulfilled' ) {
        result = (
            <div className="success">
                Password successfully updated!
            </div>
        )
    } else if ( authRequest && authRequest.state == 'fulfilled' && request && request.state == 'failed' ) {
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
                        onBlur={(event) => isValid('newPassword') }
                        onChange={(event) => setNewPassword(event.target.value)}
                    />
                    { newPasswordErrorView }
                </div>
                <div className="form-field confirm-new-password">
                    <label htmlFor="confirm-new-password">Confirm New Password</label>
                    <input type="password"
                        name="confirm-new-password"
                        value={confirmNewPassword}
                        onBlur={(event) => isValid('confirmNewPassword')}
                        onChange={(event) => setConfirmNewPassword(event.target.value)}
                    />
                    { confirmPasswordErrorView }
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
