import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { authenticate, cleanupRequest } from '../state/authentication'

import Spinner from './Spinner'

/**
 * A login form allowing the user to authenticate using an email and a password.
 *
 * @param {object} props - An empty object, takes no props.
 */
const LoginForm = function(props) { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [requestId, setRequestId] = useState(null);

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const authentication = useSelector(function(state) {
        return state.authentication
    })

    /**
     * Handle the form's submission by attempting to authenticate the user.
     * Store the requestId so that we can track the request and respond to
     * errors.
     */
    const onSubmit = function(event) {
        event.preventDefault();

        setRequestId(dispatch(authenticate(email, password)))
    }

    // Make sure to do our cleanup in a useEffect so that we do it after
    // rendering.
    useEffect(function() {
        // If we're logged in then we don't want to be here.  We don't really
        // care if we were already logged in or if this is the result of a
        // successful authentication.
        if (authentication.currentUser) {
            // Cleanup our request before we go.
            dispatch(cleanupRequest({requestId: requestId}))
            navigate("/", { replace: true })
        }
    })

    // ====================== Render ==========================================

    // Show a spinner if the request we made is still in progress.
    if (authentication.requests[requestId] && authentication.requests[requestId].state == 'pending') {
        return (
            <Spinner />
        )
    }

    return (
        <form onSubmit={onSubmit}>
            {(authentication.requests[requestId] && authentication.requests[requestId].status == 403) && <div className="authentication-error">Login failed.</div>}

            <label htmlFor="email">Email:</label>
            <input type="text" 
                name="email" 
                value={email}
                onChange={ (event) => setEmail(event.target.value) } />

            <label htmlFor="password">Password:</label>
            <input type="password" 
                name="password" 
                value={password}
                onChange={ (event) => setPassword(event.target.value) } />
            <input type="submit" name="login" value="Login" />
        </form>
    )
}

export default LoginForm 
