import React, { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { postUsers, cleanupRequest } from '/state/users'

import UserTag from '/components/users/UserTag'
import Spinner from '/components/Spinner'
import Button from '/components/generic/button/Button'

import './UserInvite.css'

const UserInvite = function({ initialName, hideInviteForm, setInvitedUser }) {
    const [ name, setName ] = useState('')
    const [ email, setEmail ] = useState('')

    const [ submissionError, setSubmissionError ] = useState(false)

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const nameInputRef = useRef(null)

    const dispatch = useDispatch()

    const invite = function(event) {
        event.preventDefault()
        event.stopPropagation()

        if ( ! email ) {
            setSubmissionError(true)
            return
        }

        if ( ! name ) {
            setSubmissionError(true)
            return
        }

        setRequestId(dispatch(postUsers({
            name: name,
            email: email
        })))
    }

    const cancel = function(event) {
        hideInviteForm()
    }

    useLayoutEffect(function() {
        setName(initialName)
    }, [ initialName ])

    useEffect(function() {
        if ( nameInputRef.current ) {
            nameInputRef.current.focus()
        }
    }, [])

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            setInvitedUser(request.result.entity)
        }
    }, [ request ])


    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    let content = ( <Spinner local={true} /> )

    if ( ! request || request.state != 'pending' ) {

        let requestError = null
        if ( request && request.state == 'failed' ) {
            requestError = (
                <div className="error">
                    Something went wrong: { request.error }
                </div>
            )
        }
        let successMessage = null
        if ( request && request.state == 'fulfilled' ) {
            successMessage = (
                <div className="success">
                    { request.result.name } has been invited!
                </div>
            )
        }

        content = (
            <>
                <h3>Invite New User</h3> 
                <p>To invite a new user, please enter their name and email. We'll send them an email letting them know they've been invited and allowing them to claim the account.</p>
                <div className="user-inputs">
                    <div className="form-inputs">
                        <label htmlFor="name">Name</label>
                        <input type="text" ref={nameInputRef} onChange={(e) => setName(e.target.value)} value={name} name="name" />
                        <label htmlFor="email">Email</label>
                        <input type="text" onChange={(e) => setEmail(e.target.value)} value={email}  name="email" />
                        <Button onClick={cancel}>Cancel</Button><Button onClick={invite}>Invite</Button>
                    </div>
                </div>
                <div className="errors">
                    { submissionError && ! name && <div className="error">Name is required.</div> }
                    { submissionError && ! email && <div className="error">Email is required.</div> }
                    { requestError }
                </div>
                { successMessage }
            </>
        )    
    }


    return (
        <div className="user-invite">
            { content }
        </div>
    )
}

export default UserInvite
