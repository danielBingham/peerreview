import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchAuthentication, cleanupRequest as cleanupAuthenticationRequest } from '/state/authentication'
import { patchUser, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'

import './ChangePasswordForm.css'

const ChangePasswordForm = function(props) {
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [oldPassword, setOldPassword] = useState('')

    const [confirmPasswordError, setConfirmPasswordError] = useState(null)
    const [oldPasswordError, setOldPasswordError] = useState(null)

    const [result, setResult] = useState(null)

    const [requestId, setRequestId] = useState(null)
    const [ authRequestId, setAuthRequestId] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const authRequest = useSelector(function(state) {
        if ( authRequestId ) {
            return state.authentication.requests[authRequestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const clearErrors = function() {
        setConfirmPasswordError(null)
        setOldPasswordError(null)
    }

    
    const clearForm = function() {
        clearErrors()
        setResult(null)
    }

    const onSubmit = function(event) {
        event.preventDefault()
        clearForm()

        if (newPassword != confirmNewPassword ) {
            setConfirmPasswordError('Your passwords must match.')
            return
        }
        setAuthRequestId(dispatch(patchAuthentication(currentUser.email, oldPassword)))

    }

    useEffect(function() {
        if ( authRequest && authRequest.state == 'fulfilled') {
            if ( authRequest.status == 200 ) {
                const user = {
                    id: currentUser.id,
                    password: newPassword
                }

                setRequestId(dispatch(patchUser(user)))
            } else {
                setOldPasswordError('Authentication failed.  Make sure you typed your old password correctly.')
            }
        } else if (authRequest && authRequest.state == 'failed') {
            setOldPasswordError('Authentication failed.  Make sure you typed your old password correctly.')
        }
    }, [ authRequest ])
                

    useEffect(function() {
        if ( request && request.state == 'fulfilled') {
            clearErrors()
            setResult('Successfully updated password!')
        } else if(request && request.state == 'failed') {
            clearErrors()
            setResult('Something went wrong. Please try again.')
        }
    }, [ request ])


    let submit = null
    if ( ( request && request.state == 'in-progress') || (authRequest && authRequest.state == 'in-progress') ) {
        submit = ( <Spinner /> )
    } else {
        submit = ( <input type="submit" name="submit" value="Change Password" /> )
    }

    return (
        <div className="change-password-form">
            <form onSubmit={onSubmit}>
                <h2>Change Password</h2>
                <div className="form-field new-password">
                    <label htmlFor="new-password">New Password</label>
                    <input type="password"
                        name="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                    />
                </div>
                <div className="form-field confirm-new-password">
                    <label htmlFor="confirm-new-password">Confirm New Password</label>
                    <input type="password"
                        name="confirm-new-password"
                        value={confirmNewPassword}
                        onChange={(event) => setConfirmNewPassword(event.target.value)}
                    />
                    <div className="error">{ confirmPasswordError } </div>
                </div>
                <div className="form-field old-password">
                    <label htmlFor="old password">Old Password</label>
                    <input type="password"
                        name="old-password"
                        value={oldPassword}
                        onChange={(event) => setOldPassword(event.target.value)}
                    />
                    <div className="error">{ oldPasswordError }</div>
                </div>
                <div className="result">
                    { result }
                </div>
                <div className="submit">
                    { submit }                    
                </div>
            </form>
        </div>   
    )
}

export default ChangePasswordForm
