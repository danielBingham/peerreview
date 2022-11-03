import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchAuthentication, cleanupRequest as cleanupAuthRequest } from '/state/authentication'
import { patchUser, cleanupRequest } from '/state/users'

import './ChangeEmailForm.css'

const ChangeEmailForm = function(props) {

    // ======= Render State =========================================

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const [emailError, setEmailError] = useState(null)
    const [passwordError, setPasswordError] = useState(null)

    // ======= Request Tracking =====================================

    const [ authRequestId, setAuthRequestId] = useState(null)
    const authRequest = useSelector(function(state) {
        if ( authRequestId ) {
            return state.authentication.requests[authRequestId]
        } else {
            return null
        }
    })

    const [ requestId, setRequestId ] = useState(null)
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

        if ( ! field || field == 'email' ) {
            if ( ! email || email.length == 0 ) {
                setEmailError('no-email')
                error = true
            } else if ( email.length > 512 ) {
                setEmailError('email-too-long')
                error = true
            } else if ( ! email.includes('@') ) {
                setEmailError('invalid-email')
                error = true
            } else if ( emailError ) {
                setEmailError(null)
            }
        }

        if ( ! field || field == 'password' ) {
            if ( ! password || password.length <= 0 ) {
                setPasswordError('no-password')
            } else {
                setPasswordError(null)
            }
        }

        return ! error
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        // TODO TECHDEBT : We don't need to do this.  It's built into the patch
        // endpoint now.
        setAuthRequestId(dispatch(patchAuthentication(currentUser.email, password)))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( authRequest && authRequest.state == 'fulfilled') {
            if ( authRequest.status == 200 ) {
                const user = {
                    id: currentUser.id,
                    email: email,
                    oldPassword: password
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

    // Clean up authRequest.
    useEffect(function() {
        return function cleanup() {
            if ( authRequestId ) {
                dispatch(cleanupAuthRequest({ requestId: authRequestId }))
            }
        }
    }, [ authRequestId ])


    // ======= Render ===============================================

    let submit = null
    if ( ( request && request.state == 'in-progress') || (authRequest && authRequest.state == 'in-progress') ) {
        submit = ( <Spinner /> )
    } else {
        submit = ( <input type="submit" name="submit" value="Change Email" /> )
    }

    let errors = [] 
    if ( request && request.state == 'failed' ) {
        errors.push(
            <div key="request-failed" className="request-failed">
                Something went wrong with the request: { request.error }.
            </div>
        )
    }
    if ( authRequest && authRequest.state == 'fulfilled' && authRequest.status !== 200 ) {
        errors.push(
            <div key="auth-failed" className="auth-failed">
                Authentication failed.  Please make sure you typed your password correctly.
            </div>
        )
    } else if (authRequest && authRequest.state == 'failed' ) {
        errors.push(
            <div key="auth-failed" className="auth-failed">
                Authentication failed.  Please make sure you typed your password correctly.
            </div>
        )
    }

    let result = null
    if ( request && request.state == 'fulfilled' ) {
        result = ( <div className="success">Email successfully updated!</div>)
    }

    let emailErrorView = null
    if ( emailError && emailError == 'no-email' ) {
        emailErrorView = (<div className="error">Email required.</div> )
    } else if ( emailError && emailError == 'email-too-long' ) {
        emailErrorView = (<div className="error">Your email is too long.  Limit is 512 characters.</div>)
    } else if ( emailError && emailError == 'invalid-email' ) {
        emailErrorView = (<div className="error">Please enter a valid email.</div>)
    }

    let passwordErrorView = null
    if ( passwordError && passwordError == 'no-password' ){
        passwordErrorView = (<div className="error">Your password is required to change your email.</div>)
    }

    return (
        <div className="change-email-form">
            <form onSubmit={onSubmit}>
                <h2>Change Email</h2>
                <div className="form-field email">
                    <label htmlFor="email">New Email</label>
                    <input type="text"
                        name="email"
                        value={email}
                        onBlur={(event) => isValid('email')}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    { emailErrorView }
                </div>
                <div className="form-field password">
                    <label htmlFor="password">Password</label>
                    <input type="password"
                        name="password"
                        value={password}
                        onBlur={(event) => isValid('password')}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    { passwordErrorView }
                </div>
                <div className="error"> { errors } </div>
                <div className="result"> { result } </div>
                <div className="submit"> { submit } </div>
            </form>
        </div>

    )

}

export default ChangeEmailForm
