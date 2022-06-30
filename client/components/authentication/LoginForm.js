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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [requestId, setRequestId] = useState(null);

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const request = useSelector(function(state) {
        if (requestId) {
            return state.authentication.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    /**
     * Handle the form's submission by attempting to postAuthentication the user.
     * Store the requestId so that we can track the request and respond to
     * errors.
     */
    const onSubmit = function(event) {
        event.preventDefault();

        setRequestId(dispatch(postAuthentication(email, password)))
    }

    useLayoutEffect(function() {
        document.body.className='grey-background'

        return function cleanup() {
            document.body.className=''
        }
    }, [])

    useEffect(function() {
        // If we're logged in then we don't want to be here.  We don't really
        // care if we were already logged in or if this is the result of a
        // successful authentication.
        if ( currentUser ) {
            // Cleanup our request before we go.
            dispatch(cleanupRequest({requestId: requestId}))
            navigate("/", { replace: true })
        }
    })

    // ====================== Render ==========================================

    // Show a spinner if the request we made is still in progress.
    if (request && request.state == 'pending') {
        return (
            <Spinner />
        )
    }

    return (
        <div className='login-form'>
            <h2>Login</h2>
            <form onSubmit={onSubmit}>
                {(request && request.status == 403) && <div className="authentication-error">Login failed.</div>}

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
