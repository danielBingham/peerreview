import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { postUsers, cleanupRequest as cleanupUsersRequest } from '/state/users'
import { postAuthentication, cleanupRequest as cleanupAuthenticationRequest } from '/state/authentication'

import Spinner from '/components/Spinner'

import './RegistrationForm.css'

/**
 * A user registration form that will allow a user to register themselves and
 * then will postAuthentication them on a successful registration.
 *
 * @param {object} props - An empty object, takes no props.
 */
const RegistrationForm = function(props) { 

    // ======= Render State =========================================
    
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [institution, setInstitution] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [passwordConfirmationError, setPasswordConfirmationError] = useState(false)

    // ======= Request Tracking =====================================

    const [postUsersRequestId, setPostUsersRequestId] = useState(null)
    const postUsersRequest = useSelector(function(state) {
        if (postUsersRequestId) {
            return state.users.requests[postUsersRequestId]
        } else {
            return null
        }
    })

    const [postAuthenticationRequestId, setAuthenticateRequestId] = useState(null)
    const authenticationRequest = useSelector(function(state) {
        if (postAuthenticationRequestId) {
            return state.authentication.requests[postAuthenticationRequestId]
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
     * Handle a form submission event.
     *
     * @param {object} event - The standard javascript event object.
     */
    const onSubmit = function(event) {
        event.preventDefault();

        if (password != confirmPassword) {
            setPasswordConfirmationError(true)
            return
        }

        const user = {
            name: name,
            email: email,
            institution: institution,
            password: password
        }

        setPostUsersRequestId(dispatch(postUsers(user)))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        // If we have a user logged in, at all, then we want to navigate away
        // to the home page.  This works whether we're nagivating away to the
        // home page after we've authenticated a newly registered user or
        // navigating away to the homepage after an already authenticated user
        // somehow winds up on the registration page.  Either way, we don't
        // want to be here.
        if ( currentUser ) {
            navigate("/")
        }
    }, [ currentUser ])

    useEffect(function() {
        // If we've successfully created our user, then we want to authenticate them.
        if ( postUsersRequest && postUsersRequest.state == 'fulfilled') {
            setAuthenticateRequestId(dispatch(postAuthentication(email, password)))
        } 
    }, [ postUsersRequest ])


    useLayoutEffect(function() {
        // Handle errors in the registration process.
        if ( postUsersRequest && postUsersRequest.status == 'failed' ) {
        }
    }, [ postUsersRequest ])

    // Cleanup the postUsersRequest.
    useEffect(function() {
        return function cleanup() {
            if ( postUsersRequestId ) {
                dispatch(cleanupUsersRequest({requestId: postUsersRequestId}))
            }
        }
    }, [ postUsersRequestId])

    // Cleanup the postAuthenticationRequest.
    useEffect(function() {
        return function cleanup() {
            if ( postAuthenticationRequestId ) {
                dispatch(cleanupAuthenticationRequest({requestId: postAuthenticationRequestId}))
            }
        }
    }, [ postAuthenticationRequestId])



    // ====================== Render ==========================================

    // If either of our requests are in progress, render a spinner.
    if ( (postUsersRequest && postUsersRequest.state == 'pending' )
        || (authenticationRequest && authenticationRequest.state == 'pending' ) ) {

        return (
            <Spinner />
        )
    }

    let overallError = null
    let emailError = null
    if ( postUsersRequest && postUsersRequest.state == 'failed') {
        if (postUsersRequest.status == 409 ) {
            emailError = ( <div className="email-conflict-error">A user with that email already exists.  Please login instead.</div> )
        } else { 
            overallError = (<div className="unknown-error">{ postUsersRequest.error }</div> )
        }
    }

    let passwordConfirmationErrorElement = null
    if ( passwordConfirmationError ) {
        passwordConfirmationErrorElement = ( <div className="unmatched-passwords-error">Your passwords don't match!</div> )
    }

    return (
        <div className="registration-form">
            <h2>Register</h2>
            <form onSubmit={onSubmit}>
                <div className="error"> {overallError} </div>

                <div className="name field-wrapper">
                    <label htmlFor="name">Name:</label>
                    <input type="text" 
                        name="name" 
                        value={name} 
                        onChange={ (event) => setName(event.target.value) } />
                    <div className="error"></div>
                </div>

                <div className="email field-wrapper">
                    <label htmlFor="email">Email:</label>
                    <input type="text" 
                        name="email" 
                        value={email}
                        onChange={ (event) => setEmail(event.target.value) } />
                    <div className="error">{emailError}</div>
                </div>

                <div className="institution field-wrapper">
                    <label htmlFor="institution">Institution:</label>
                    <input type="text" 
                        name="institution" 
                        value={institution}
                        onChange={ (event) => setInstitution(event.target.value) } />
                </div>

                <div className="password field-wrapper">
                    <label htmlFor="password">Password:</label>
                    <input type="password" 
                        name="password" 
                        value={password}
                        onChange={ (event) => setPassword(event.target.value) } />
                    <div className="error"></div>
                </div>

                <div className="confirm-password field-wrapper">
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input type="password" 
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={ (event) => setConfirmPassword(event.target.value) } />
                    <div className="error">{passwordConfirmationErrorElement}</div>
                </div>
                <div className="submit field-wrapper">
                    <input type="submit" name="register" value="Register" />
                </div>
            </form>
        </div>
    )
}

export default RegistrationForm
