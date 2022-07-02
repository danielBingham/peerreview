import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getUser, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'
import './UserTag.css'

const UserTag = function(props) {
    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        return state.users.requests[requestId]
    })

    const user = useSelector(function(state) {
        if ( state.users.dictionary[props.id] ) {
            return state.users.dictionary[props.id]
        } else {
            return null
        }
    })

    useEffect(function() {
        if ( ! requestId ) {
            setRequestId(dispatch(getUser(props.id)))
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }

    }, [ request ])


    if ( user ) {
        return (
            <span id={ `user-tag-${user.id}` } className="user-tag" ><Link to={ `/user/${user.id}` }>{user.name}</Link> ({user.reputation})</span> 
        )
    } else {
        return (<Spinner />)
    }

}

export default UserTag
