import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchAuthentication, cleanupRequest as cleanupAuthRequest } from '/state/authentication'
import { patchUser, cleanupRequest } from '/state/users'

import './ChangeEmailForm.css'

const ChangeEmailForm = function(props) {

    // ======= Render State =========================================

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

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

    const onSubmit = function(event) {
        event.preventDefault()
        
        setAuthRequestId(dispatch(patchAuthentication(currentUser.email, password)))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( authRequest && authRequest.state == 'fulfilled') {
            if ( authRequest.status == 200 ) {
                const user = {
                    id: currentUser.id,
                    email: email
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

    return (
        <div className="change-email-form">
            <form onSubmit={onSubmit}>
                <h2>Change Email</h2>
                <div className="form-field email">
                    <label htmlFor="email">New Email</label>
                    <input type="text"
                        name="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </div>
                <div className="form-field password">
                    <label htmlFor="password">Password</label>
                    <input type="password"
                        name="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>
                <div className="error"> { errors } </div>
                <div className="result"> { result } </div>
                <div className="submit"> { submit } </div>
            </form>
        </div>

    )

}

export default ChangeEmailForm
