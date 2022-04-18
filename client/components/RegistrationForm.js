import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { useDispatch, useSelector } from 'react-redux'

import { postUsers } from '../state/users'
import { authenticate } from '../state/authentication'

const RegistrationForm = function(props) { 
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [overallError, setOverallError] = useState('')
    const [emailError, setEmailError] = useState('')
    const [passwordConfirmationError, setPasswordConfirmationError] = useState('')

    const dispatch = useDispatch()
    const navigate = useNavigate()


    const postUsersRequest = useSelector(function(state) {
        return state.users.postUsers
    })
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

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

        dispatch(postUsers(user))
    }

    useEffect(function() {
        // If we have a user logged in, at all, then we want to navigate away
        // to the home page.  This works whether we're nagivating away to the
        // home page after we've authenticated a newly registered user or
        // navigating away to the homepage after an already authenticated user
        // somehow winds up on the registration page.  Either way, we don't
        // want to be here.
        if ( currentUser ) {
            navigate("/", {replace: true})
        }

        if (postUsersRequest.target && postUsersRequest.target.email == email 
            && postUsersRequest.completed && ! postUsersRequest.error) {

            dispatch(authenticate(email, password))
        } 
    })

    if ( postUsersRequest.target && postUsersRequest.target.email == email) {
        if (postUsersRequest.error == 409 ) {
            setEmailError('A user with that email already exists.  Please login instead.')
        } else if (postUsersRequest.error) {
            setOverallError(postUsersRequest.error)
        }
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
