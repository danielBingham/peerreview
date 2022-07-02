import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {getUsers, cleanupRequest } from '/state/users'

import UserBadge from '../UserBadge'

import Spinner from '/components/Spinner'

import './UserListView.css'

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
        return state.users.dictionary
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
            userBadges.push(<div key={user.id} className="badge-wrapper"><UserBadge id={user.id} /></div>)
        }
        return (
            <div className="user-list">
                <div className="header">
                    <h1>Users</h1>
                </div>
                <div className="user-wrapper">
                    {userBadges} 
                </div>
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
