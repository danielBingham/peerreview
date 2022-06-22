import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {getUsers, cleanupRequest } from '/state/users'

import UserBadge from '../UserBadge'

import Spinner from '/components/Spinner'

const UserListView = function(props) {
    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const users = useSelector(function(state) {
        return state.users.users
    })

    useEffect(function() {
        if ( ! requestId ) {
            setRequestId(dispatch(getUsers()))
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }

    }, [ request ])


    if ( users ) {
        const userBadges = []
        for( const user of Object.values(users)) {
            userBadges.push(<UserBadge key={user.id} id={user.id} />)
        }
        return (
            <div className="user-list">
                {userBadges} 
            </div>

        ) 
    } else if (request && request.state == 'fulfilled') {
        return (
            <div className="user-list">
            </div>
        )
    } else {
        return ( <Spinner /> )
    }
        
}

export default UserListView
