import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getUser, cleanupRequest } from '../../state/users'
import Spinner from '../Spinner'

const UserProfileView = function(props) {
    const [ userRequestId, setUserRequestId ] = useState(null)
    const [ error, setError ] = useState(null)

    const dispatch = useDispatch()

    const userRequest = useSelector(function(state) {
        if ( ! userRequestId) {
            return null
        } else {
            return state.users.requests[userRequestId]
        }
    })

    const user = useSelector(function(state) {
        if ( state.users.users[props.id] ) {
            return state.users.users[props.id]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    useEffect(function() {
        if ( ! user && ! userRequestId ) {
            setUserRequestId(dispatch(getUser(props.id)))
        }

        return function cleanup() {
            if ( userRequestId ) {
                dispatch(cleanupRequest(getUserRequestId))
            }
        }
    }, [ ])

    useEffect(function() {
        if ( userRequest && userRequest.state == 'failed') {
            setError(userRequest.error)
        }
    })

    if ( ! user ) {
        return ( <Spinner /> )
    } else {
        return (
            <section id={ user.id } className='user-profile-view'>
                <div className="error">{ error } </div>
                <div className="profile-header">{currentUser && currentUser.id == user.id && <Link to="edit">edit</Link>}</div>
                <p><span className="label">Name:</span> { user.name }</p>
                <p><span className="label">Email:</span> { user.email }</p>
            </section>
        )
    }

}

export default UserProfileView
