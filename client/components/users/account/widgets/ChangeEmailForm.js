import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchAuthentication, cleanupRequest as cleanupAuthRequest } from '/state/authentication'
import { patchUser, cleanupRequest } from '/state/users'

import './ChangeEmailForm.css'

const ChangeEmailForm = function(props) {
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const [ error, setError ] = useState(null)
    const [ result, setResult ] = useState(null)

    const [ authRequestId, setAuthRequestId] = useState(null)
    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const authRequest = useSelector(function(state) {
        if ( authRequestId ) {
            return state.authentication.requests[authRequestId]
        } else {
            return null
        }
    })

    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const onSubmit = function(event) {
        event.preventDefault()
        
        setAuthRequestId(dispatch(patchAuthentication(currentUser.email, password)))
    }

    useEffect(function() {
        if ( authRequest && authRequest.state == 'fulfilled') {
            if ( authRequest.status == 200 ) {
                const user = {
                    id: currentUser.id,
                    email: email
                }

                setRequestId(dispatch(patchUser(user)))
            } else {
                setError('Authentication failed.  Please make sure you typed your password correctly.')
            }
        } else if (authRequest && authRequest.state == 'failed') {
            setError('Authentication failed.  Please make sure you typed your password correctly.')
        }
    }, [ authRequest ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled') {
            setResult('Successfully updated email!')
        } else if( request && request.state == 'failed') {
            setError('Something went wrong.  Please try again. If the error persists, contact support.')
        }

    }, [request])

    let submit = null
    if ( ( request && request.state == 'in-progress') || (authRequest && authRequest.state == 'in-progress') ) {
        submit = ( <Spinner /> )
    } else {
        submit = ( <input type="submit" name="submit" value="Change Email" /> )
    }


    return (
        <div className="change-email-form">
            <form onSubmit={onSubmit}>
                <h2>Change Email</h2>
                <div className="form-field email">
                    <label htmlFor="email">New Email</label>
                    <input type="text"
                        name="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </div>
                <div className="form-field password">
                    <label htmlFor="password">Password</label>
                    <input type="password"
                        name="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>
                <div className="error"> { error } </div>
                <div className="result"> { result } </div>
                <div className="submit"> { submit } </div>
            </form>
        </div>

    )

}

export default ChangeEmailForm
