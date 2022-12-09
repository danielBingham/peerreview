import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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

    const [nameError, setNameError] = useState(null)
    const [emailError, setEmailError] = useState(null)
    const [passwordError, setPasswordError] = useState(null)
    const [passwordConfirmationError, setPasswordConfirmationError] = useState(null)

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

        if ( ! field || field == 'name' ) {
            if ( ! name || name.length == 0 ) {
                setNameError('no-name')
                error = true
            } else if ( name.length > 512 ) {
                setNameError('name-too-long')
                error = true
            } else if ( nameError ) {
                setNameError(null)
            }
        }

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
            if ( ! password || password.length == 0 ) {
                setPasswordError('no-password')
                error = true
            } else if ( password.length < 16 ) {
                setPasswordError('password-too-short')
                error = true
            } else if ( password.length > 256 ) {
                setPasswordError('password-too-long')
                error = true
            } else if ( passwordError ) {
                setPasswordError(null)
            }
        }

        if ( ! field || field =='confirmPassword' ) {
            if (password != confirmPassword) {
                setPasswordConfirmationError('password-mismatch')
                error = true 
            } else if ( passwordConfirmationError ) {
                setPasswordConfirmationError(null)
            }
        }

        return ! error
    }

    /**
     * Handle a form submission event.
     *
     * @param {object} event - The standard javascript event object.
     */
    const onSubmit = function(event) {
        event.preventDefault();


        if ( ! isValid() ) {
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

    // Error views, we'll populate these as we check the various error states.
    let overallErrorView = null
    let nameErrorView = null
    let emailErrorView = null
    let passwordErrorView = null
    let passwordConfirmationErrorView = null

    if ( postUsersRequest && postUsersRequest.state == 'failed') {
        if (postUsersRequest.status == 409 ) {
            emailErrorView = ( 
                <div className="email-conflict-error">A user with that email already exists.  Please login instead.</div> 
            )
        } else { 
            overallErrorView = (<div className="unknown-error">{ postUsersRequest.error }</div> )
        }
    }

    if ( nameError && nameError == 'no-name' ) {
        nameErrorView = ( <>Name is required!</> )
    } else if ( nameError && nameError == 'name-too-long' ) {
        nameErrorView = ( <>Name is too long. Limit is 512 characters.</> )
    }

    if ( emailError && emailError == 'no-email' ) {
        emailErrorView = ( <>Email is required!</> )
    } else if ( emailError && emailError == 'email-too-long' ) {
        emailErrorView = ( <>Email is too long.  Limit is 512 characters.</> )
    } else if ( emailError && emailError == 'invalid-email' ) {
        emailErrorView = (<>Please enter a valid email.</> )
    }

    if ( passwordError && passwordError == 'no-password') {
        passwordErrorView = ( <>Password is required!</> )
    } else if ( passwordError && passwordError == 'password-too-short') {
        passwordErrorView = (<>Your password is too short.  Please choose a password at least 16 characters in length.  We recommend the XKCD method of passphrase selection: <a href="https://xkcd.com/936/">XKCD #936: Password Strength</a>.</> )
    } else if ( passwordError && passwordError == 'password-too-long') {
        passwordErrorView = (<>Your password is too long. Limit is 256 characters.</>)
    }

    if ( passwordConfirmationError && passwordConfirmationError == 'password-mismatch' ) {
        passwordConfirmationErrorView = ( <>Your passwords don't match!</> )
    }

    return (
        <div className="registration-form">
            <h2>Register</h2>
            <div className="explanation">
                Create an account using your email and password.
            </div>
            <form onSubmit={onSubmit}>
                <div className="error"> {overallErrorView} </div>

                <div className="name field-wrapper">
                    <label htmlFor="name">Name:</label>
                    <input type="text" 
                        name="name" 
                        value={name} 
                        onBlur={ (event) => isValid('name') }
                        onChange={ (event) => setName(event.target.value) } />
                    <div className="error">{ nameErrorView }</div>
                </div>

                <div className="email field-wrapper">
                    <label htmlFor="email">Email:</label>
                    <input type="text" 
                        name="email" 
                        value={email}
                        onBlur={ (event) => isValid('email') }
                        onChange={ (event) => setEmail(event.target.value) } />
                    <div className="error">{emailErrorView}</div>
                </div>

                <div className="institution field-wrapper">
                    <label htmlFor="institution">Institution:</label>
                    <input type="text" 
                        name="institution" 
                        value={institution}
                        onBlur={ (event) => isValid('institution') }
                        onChange={ (event) => setInstitution(event.target.value) } />
                    <div className="error"></div>
                </div>

                <div className="password field-wrapper">
                    <label htmlFor="password">Password:</label>
                    <input type="password" 
                        name="password" 
                        value={password}
                        onBlur={ (event) => isValid('password') }
                        onChange={ (event) => setPassword(event.target.value) } />
                    <div className="error">{ passwordErrorView }</div>
                </div>

                <div className="confirm-password field-wrapper">
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input type="password" 
                        name="confirmPassword"
                        value={confirmPassword}
                        onBlur={ (event) => isValid('confirmPassword') }
                        onChange={ (event) => setConfirmPassword(event.target.value) } />
                    <div className="error">{ passwordConfirmationErrorView }</div>
                </div>
                <div className="submit field-wrapper">
                    <input type="submit" name="register" value="Register" />
                </div>
            </form>
        </div>
    )
}

export default RegistrationForm
