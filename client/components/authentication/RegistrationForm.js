import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { postUsers, cleanupRequest as cleanupUsersRequest } from '../../state/users'
import { postAuthentication, cleanupRequest as cleanupAuthenticationRequest } from '../../state/authentication'

import Spinner from '../Spinner'

/**
 * A user registration form that will allow a user to register themselves and
 * then will postAuthentication them on a successful registration.
 *
 * @param {object} props - An empty object, takes no props.
 */
const RegistrationForm = function(props) { 
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [overallError, setOverallError] = useState('')
    const [emailError, setEmailError] = useState('')
    const [passwordConfirmationError, setPasswordConfirmationError] = useState('')

    const [postUsersRequestId, setPostUsersRequestId] = useState(null)
    const [postAuthenticationRequestId, setAuthenticateRequestId] = useState(null)

    const dispatch = useDispatch()
    const navigate = useNavigate()


    const postUsersRequest = useSelector(function(state) {
        if (postUsersRequestId) {
            return state.users.requests[postUsersRequestId]
        } else {
            return null
        }
    })
    const authenticationRequest = useSelector(function(state) {
        if (postAuthenticationRequestId) {
            return state.authentication.requests[postAuthenticationRequestId]
        } else {
            return null
        }
    })
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    /**
     * Handle a form submission event.
     *
     * @param {object} event - The standard javascript event object.
     */
    const onSubmit = function(event) {
        event.preventDefault();

        if (password != confirmPassword) {
            setPasswordConfirmationError("Your passwords do not match!")
            return
        }

        const user = {
            name: name,
            email: email,
            password: password,
        }

        setPostUsersRequestId(dispatch(postUsers(user)))
    }


    // Make sure to do our cleanup in a useEffect so that we do it after
    // rendering.
    useEffect(function() {
        // If we have a user logged in, at all, then we want to navigate away
        // to the home page.  This works whether we're nagivating away to the
        // home page after we've postAuthenticationd a newly registered user or
        // navigating away to the homepage after an already postAuthenticationd user
        // somehow winds up on the registration page.  Either way, we don't
        // want to be here.
        if ( currentUser ) {

            // Make sure we cleanup our authentication request before we go.
            dispatch(cleanupAuthenticationRequest({requestId: postAuthenticationRequestId}))

            navigate("/", {replace: true})
        }

        // If we've successfully created our user, then we want to postAuthentication them.
        if ( postUsersRequest && postUsersRequest.state == 'fulfilled') {
            // At this point, we're done with the postUsers request, so clean
            // it up.
            dispatch(cleanupUsersRequest({requestId: postUsersRequestId}))

            setAuthenticateRequestId(dispatch(postAuthentication(email, password)))
        } 
    })


    // Handle errors in the registration process.
    if ( postUsersRequest ) {
        if (postUsersRequest.status == 409 ) {
            setEmailError('A user with that email already exists.  Please login instead.')
        } else if (postUsersRequest.error) {
            setOverallError(postUsersRequest.error)
        }
    }


    // ====================== Render ==========================================

    // If either of our requests are in progress, render a spinner.
    if ( (postUsersRequest && postUsersRequest.state == 'pending' )
        || (authenticationRequest && authenticationRequest.state == 'pending' ) ) {

        return (
            <Spinner />
        )
    }

    return (
        <form onSubmit={onSubmit}>
            <div className="error"> {overallError} </div>

            <label htmlFor="name">Name:</label>
            <input type="text" 
                name="name" 
                value={name} 
                onChange={ (event) => setName(event.target.value) } />
            <div className="error"></div>

            <label htmlFor="email">Email:</label>
            <input type="text" 
                name="email" 
                value={email}
                onChange={ (event) => setEmail(event.target.value) } />
            <div className="error">{emailError}</div>

            <label htmlFor="password">Password:</label>
            <input type="password" 
                name="password" 
                value={password}
                onChange={ (event) => setPassword(event.target.value) } />
            <div className="error"></div>

            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input type="password" 
                name="confirmPassword"
                value={confirmPassword}
                onChange={ (event) => setConfirmPassword(event.target.value) } />
            <input type="submit" name="register" value="Register" />
            <div className="error">{passwordConfirmationError}</div>
        </form>
    )
}

export default RegistrationForm
