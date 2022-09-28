import React, { useState, useLayoutEffect, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { patchUser, cleanupRequest } from '/state/users'

import './AcceptInvitationForm.css'

const AcceptInvitationForm = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [ name, setName ] = useState('')
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ confirmPassword, setConfirmPassword ] = useState('')
    const [ institution, setInstitution ] = useState('')

    const [ confirmPasswordError, setConfirmPasswordError] = useState(false)

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if (requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const acceptInvitation = function(event) {
        event.preventDefault()

        if ( password != confirmPassword ) {
            return 
        }

        // We're assuming this exists, AcceptInvitationPage should have checked
        // for us.
        const token = searchParams.get('token')
        const user = {
            id: currentUser.id,
            name: name,
            email: email,
            password: password,
            institution: institution,
            token: token
        }

        setRequestId(dispatch(patchUser(user)))
    }

    useLayoutEffect(function() {
        setName(currentUser.name)
        setEmail(currentUser.email)
    }, [ currentUser ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            navigate("/")
        } 
    }, [ request ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    let confirmPasswordErrorElement = null
    if ( password != confirmPassword) {
        confirmPasswordErrorElement = (<span>Passwords must match!</span>)
    }

    return (
        <div className="accept-invitation-form">
            <p>Select a password and update your information to complete your registration.</p>
            <form onSubmit={acceptInvitation}>
                <div className="name field-wrapper">
                    <label htmlFor="name">Name:</label>
                    <input type="text" 
                        name="name" 
                        value={name} 
                        onChange={ (event) => setName(event.target.value) } />
                </div>

                <div className="email field-wrapper">
                    <label htmlFor="email">Email:</label>
                    <input type="text" 
                        name="email" 
                        value={email}
                        onChange={ (event) => setEmail(event.target.value) } />
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
                </div>

                <div className="confirm-password field-wrapper">
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input type="password" 
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={ (event) => setConfirmPassword(event.target.value) } 
                    />
                    <div className="error"> { confirmPasswordErrorElement } </div>
                </div>
                <div className="submit field-wrapper">
                    <input type="submit" name="register" value="Accept Invitation" />
                </div>

            </form>
        </div>
    )
}

export default AcceptInvitationForm
