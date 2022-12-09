import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    // ======= Request Tracking =====================================
   
    const [requestId, setRequestId] = useState(null)

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

    const config = useSelector(function(state) {
        return state.system.configuration
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
        event.preventDefault()

        if ( ! email || email.length == 0 ) {
            setError('no-email')
            return
        }
        
        if ( ! password || password.length == 0 ) {
            setError('no-password')
            return
        } 

        setRequestId(dispatch(postAuthentication(email, password)))
    }

    // ======= Effect Handling ======================================
    
    useEffect(function() {
        // If we're logged in then we don't want to be here.  We don't really
        // care if we were already logged in or if this is the result of a
        // successful authentication.
        if ( currentUser ) {
            navigate("/")
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

    // Show a spinner if the request we made is still in progress.
    if (request && request.state == 'pending') {
        return (
            <Spinner />
        )
    } 

    let errorMessage = ''
    if ( request && request.state == 'failed') {
        if ( request.status == 403 ) {
            errorMessage = "Login failed."
        } else if ( request.status == 400) {
            if ( request.error == 'no-password' ) {
                errorMessage = "Your account appears to have been created using OAuth.  Please login with the authentication method you used to create it."
            } else if (request.error == 'password-required' ) {
                errorMessage = "You must enter a password to login."
            } else {
                errorMessage = "Login failed."
            }
        } else {
            errorMessage = "Something went wrong on the backend. Since this is an authentication error, we can't share any details (security). Please report a bug and we'll try to figure out it out from server logs."
        }
    } else if ( error == 'no-password' ) {
        errorMessage = " A password is required to login. "
    } else if ( error == 'no-email') {
        errorMessage = "An email is required to login."
    }

    const errorView = ( <div className="error">{ errorMessage }</div> )

    return (
        <div className='login-form'>
            <h2>Login</h2>
            <form onSubmit={onSubmit}>
                <div className="error"> { errorView } </div>

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
