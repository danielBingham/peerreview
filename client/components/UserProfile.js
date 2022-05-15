import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getUser, cleanupRequest } from '../state/users'
import Spinner from './Spinner'

const UserProfile = function(props) {
    const [ getUserRequestId, setGetUserRequestId ] = useState(null)

    const { id } = useParams()

    const dispatch = useDispatch()

    const user = useSelector(function(state) {
        if ( state.users.users[id] ) {
            return state.users.users[id]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    if ( ! user && ! getUserRequestId ) {
        setGetUserRequestId(dispatch(getUser(id)))
    }

    useEffect(function() {
    
        if ( user && getUserRequestId ) {
            dispatch(cleanupRequest(getUserRequestId))
        }
    })

    if ( ! user ) {
        return ( <Spinner /> )
    } else {
        return (
            <section id={ id }>
                <div className="profile-header">{currentUser && currentUser.id == user.id && <Link to="edit">edit</Link>}</div>
                <p><span className="label">Name:</span> { user.name }</p>
                <p><span className="label">Email:</span> { user.email }</p>
            </section>
        )
    }

}

export default UserProfile;
