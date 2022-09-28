import React, { useState, useLayoutEffect, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { postUsers, cleanupRequest } from '/state/users'

import UserTag from '/components/users/UserTag'
import Spinner from '/components/Spinner'

import './AuthorInvite.css'

const AuthorInvite = function(props) {
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

    useLayoutEffect(function() {
        setName(props.name)
    }, [ props.name ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            props.append(request.result)
        }
    }, [ request ])


    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    let content = (
        <>
        <p>No author found that matches "{name}".  Would you like to add and invite them?</p>
        <div className="user-inputs">
            <label htmlFor="name">Name: </label>
            <input type="text" onChange={(e) => setName(e.target.value)} value={name} name="name" />
            <label htmlFor="email">Email: </label>
            <input type="text" onChange={(e) => setEmail(e.target.value)} value={email}  name="email" />
            <button onClick={invite} name="invite">Invite</button> 
        </div>
        <div className="errors">
            { submissionError && ! name && <div className="error">Name is required.</div> }
            { submissionError && ! email && <div className="error">Email is required.</div> }
        </div>
        </>
    )    

    if ( request && request.state == 'pending' ) {
        content = ( <Spinner local={true} /> )
    } else if ( request && request.state == 'failed' ) {
        content = (
            <div className="error">
                Something went wrong: { request.error }
            </div>
        )
    } else if ( request && request.state == 'fulfilled' ) {
        content = (
            <div className="success">
                { request.result.name } has been invited!
            </div>
        )
    }

    return (
        <div className="author-invite">
            { content }
        </div>
    )
}

export default AuthorInvite
