import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import ReactMarkdown from 'react-markdown'

import { getUser, cleanupRequest as cleanupUserRequest } from '/state/users'

import Field from '/components/fields/Field'

import Spinner from '/components/Spinner'

import './UserView.css'

const UserView = function(props) {
    const [ userRequestId, setUserRequestId ] = useState(null)
    const [ error, setError ] = useState(null)
    console.log(`\n\n### UserView(${props.id}) ###`)

    const dispatch = useDispatch()

    const userRequest = useSelector(function(state) {
        if ( ! userRequestId) {
            return null
        } else {
            return state.users.requests[userRequestId]
        }
    })
    console.log('userRequest')
    console.log(userRequest)

    const user = useSelector(function(state) {
        if ( state.users.dictionary[props.id] ) {
            return state.users.dictionary[props.id]
        } else {
            return null
        }
    })

    console.log('user')
    console.log(user)

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    console.log('Current User: ')
    console.log(currentUser)

    useEffect(function() {
        console.log(`==== UserView.EFFECT getUser(${props.id}) ====`)
        if ( ! userRequestId ) {
            console.log('Requesting a user.')
            console.log(userRequestId)
            setUserRequestId(dispatch(getUser(props.id)))
        }
        console.log(`==== END UserView.EFFECT getUser(${props.id}) ====`)


        return function cleanup() {
            if ( userRequestId ) {
                dispatch(cleanupUserRequest(userRequest))
            }
        }
    }, [ ])

    useEffect(function() {
        console.log('=== UserView.EFFECT request failed check. ===')
        console.log(`userRequest`)
        console.log(userRequest)
        if ( userRequest && userRequest.state == 'failed') {
            console.log('Request failed with error: ')
            console.log(userRequest.error)
            setError(userRequest.error)
        }
        console.log('=== END UserView.Effect ===')
    }, [ userRequest ])

    console.log(`==== UserView.RENDERING ====`)
    console.log('user')
    console.log(user)
    if ( ! user || ! user.fields ) {
        return ( <Spinner /> )
    } else {
        const fields = []
        const sortedFields = [...user.fields]
        sortedFields.sort((a, b) => {
            const first = b.reputation - a.reputation
            if ( first == 0 ) {
                return a.field.id - b.field.id
            } else {
                return first
            }
        })
        for ( const userField of sortedFields) {
            fields.push(<div key={ userField.field.id } className="wrapper"><Field field={ userField.field } /> { userField.reputation } </div>)
        }

        return (
            <article id={ user.id } className='user-view'>
                <div className="error">{ error } </div>
                <div className="controls">{currentUser && currentUser.id == user.id && <Link to="/account">edit</Link>}</div>
                <div className="header"><h1>{ user.name }</h1></div>
                <div className="profile-picture"></div>
                <div className="details">
                    <p><span className="label">Name</span> { user.name }</p>
                    <p><span className="label">Email</span> { user.email }</p>
                    <p><span className="label">Institution</span> { user.institution } </p>
                    <p><span className="label">Location</span> { user.location }</p>
                    <p><span className="label">Bio</span><ReactMarkdown children={ user.bio } /> </p>
                </div>
                <div className="fields-header">
                    <h2>Fields</h2>
                </div>
                <div className="fields">
                    {fields}
                </div>
            </article>
        )
    }
}

export default UserView 
