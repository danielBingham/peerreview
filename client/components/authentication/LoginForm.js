import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { postAuthentication, cleanupRequest } from '/state/authentication'

import Spinner from '/components/Spinner'

import './LoginForm.css'

/**
 * A login form allowing the user to postAuthentication using an email and a password.
 *
 * @param {object} props - An empty object, takes no props.
 */
const LoginForm = function(props) { 

    // ======= Render State =========================================
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // ======= Request Tracking =====================================
   
    const [requestId, setRequestId] = useState(null);

    const request = useSelector(function(state) {
        if (requestId) {
            return state.authentication.requests[requestId]
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
    const navigate = useNavigate()

    /**
     * Handle the form's submission by attempting to authenticate the user.
     * Store the requestId so that we can track the request and respond to
     * errors.
     *
     * @param {Event} event Standard Javascript event.
     */
    const onSubmit = function(event) {
        event.preventDefault();

        setRequestId(dispatch(postAuthentication(email, password)))
    }

    // ======= Effect Handling ======================================
    
    useEffect(function() {
        // If we're logged in then we don't want to be here.  We don't really
        // care if we were already logged in or if this is the result of a
        // successful authentication.
        if ( currentUser ) {
            navigate("/", { replace: true })
        }
    })

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ====================== Render ==========================================

    let error = null
    // Show a spinner if the request we made is still in progress.
    if (request && request.state == 'pending') {
        return (
            <Spinner />
        )
    } 

    if ( request && request.state == 'failed') {
        if ( request.status == 403 ) {
            error = (<div className="authentication-error">Login failed.</div>)
        } else {
            error = (<div className="general-error">Something went wrong: { request.error }. Please report a bug.</div>)
        }
    }

    return (
        <div className='login-form'>
            <h2>Login</h2>
            <form onSubmit={onSubmit}>
                <div className="error"> { error } </div>

                <div className="email field-wrapper">
                    <label htmlFor="email">Email</label>
                    <input type="text" 
                        name="email" 
                        value={email}
                        onChange={ (event) => setEmail(event.target.value) } />
                </div>

                <div className="password field-wrapper">
                    <label htmlFor="password">Password</label>
                    <input type="password" 
                        name="password" 
                        value={password}
                        onChange={ (event) => setPassword(event.target.value) } />
                </div>
                <div className="submit field-wrapper">
                    <input type="submit" name="login" value="Login" />
                </div>
            </form>
        </div>
    )
}

export default LoginForm 
