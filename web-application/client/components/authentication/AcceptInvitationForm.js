import React, { useState, useLayoutEffect, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { patchUser, cleanupRequest } from '/state/users'

import './AcceptInvitationForm.css'

const AcceptInvitationForm = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================
    
    const [ name, setName ] = useState('')
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ confirmPassword, setConfirmPassword ] = useState('')
    const [ institution, setInstitution ] = useState('')

    const [nameError, setNameError] = useState(null)
    const [emailError, setEmailError] = useState(null)
    const [passwordError, setPasswordError] = useState(null)
    const [confirmPasswordError, setConfirmPasswordError] = useState(null)

    // ======= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if (requestId ) {
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
                setConfirmPasswordError('password-mismatch')
                error = true 
            } else if ( confirmPasswordError ) {
                setConfirmPasswordError(null)
            }
        }

        return ! error
    }

    const acceptInvitation = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
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

    // ======= Effect Handling ======================================
    
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

    // Error views, we'll populate these as we check the various error states.
    let overallErrorView = null
    let nameErrorView = null
    let emailErrorView = null
    let institutionErrorView = null
    let passwordErrorView = null
    let confirmPasswordErrorView = null

    if ( request && request.state == 'failed') {
        if (request.status == 409 ) {
            emailErrorView = ( 
                <div className="email-conflict-error">A user with that email already exists.  Please login instead.</div> 
            )
        } else { 
            overallErrorView = (<div className="unknown-error">{ request.error }</div> )
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

    if ( confirmPasswordError && confirmPasswordError == 'password-mismatch' ) {
        confirmPasswordErrorView = ( <>Your passwords don't match!</> )
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
                        onBlur={ (event) => isValid('name') }
                        onChange={ (event) => setName(event.target.value) } />
                    <div className="error"> { nameErrorView } </div>
                </div>

                <div className="email field-wrapper">
                    <label htmlFor="email">Email:</label>
                    <input type="text" 
                        name="email" 
                        value={email}
                        onBlur={ (event) => isValid('email') }
                        onChange={ (event) => setEmail(event.target.value) } />
                    <div className="error"> { emailErrorView } </div>
                </div>

                <div className="institution field-wrapper">
                    <label htmlFor="institution">Institution:</label>
                    <input type="text" 
                        name="institution" 
                        value={institution}
                        onBlur={ (event) => isValid('institution') }
                        onChange={ (event) => setInstitution(event.target.value) } />
                    <div className="error"> { institutionErrorView } </div>
                </div>

                <div className="password field-wrapper">
                    <label htmlFor="password">Password:</label>
                    <input type="password" 
                        name="password" 
                        value={password}
                        onBlur={ (event) => isValid('password') }
                        onChange={ (event) => setPassword(event.target.value) } />
                    <div className="error"> { passwordErrorView } </div>
                </div>

                <div className="confirm-password field-wrapper">
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input type="password" 
                        name="confirmPassword"
                        value={confirmPassword}
                        onBlur={ (event) => isValid('confirmPassword') }
                        onChange={ (event) => setConfirmPassword(event.target.value) } 
                    />
                    <div className="error"> { confirmPasswordErrorView} </div>
                </div>
                <div className="submit field-wrapper">
                    <input type="submit" name="register" value="Accept Invitation" />
                </div>

            </form>
        </div>
    )
}

export default AcceptInvitationForm
