import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import {getUsers, clearQuery, cleanupRequest } from '/state/users'

import UserBadge from '../UserBadge'

import Spinner from '/components/Spinner'
import PaginationControls from '/components/PaginationControls'

import './UserListView.css'

const UserListView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()
    
    // ======= Request Tracking =====================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================
    
    const users = useSelector(function(state) {
        if ( ! state.users.queries['UserList'] ) {
            return []
        }
        
        const users = []
        for( const id of state.users.queries['UserList'].result ) {
            users.push(state.users.dictionary[id])
        }

        return users 
    })

    const meta = useSelector(function(state) {
        if ( ! state.users.queries['UserList'] ) {
            return {
                count: 0,
                page: 1,
                pageSize: 1,
                numberOfPages: 1
            }
        }
        return state.users.queries['UserList'].meta
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    const setSort = function(sortBy) {
        searchParams.set('sort', sortBy)
        setSearchParams(searchParams)
    }

    useEffect(function() {
        const params = {}

        params.page = searchParams.get('users-page')
        if ( ! params.page ) {
            params.page = 1
        }
        
        params.sort = searchParams.get('sort')
        if ( ! params.sort ) {
            params.sort = 'newest'
        }

        setRequestId(dispatch(getUsers('UserList', params)))
        return function cleanup() {
            dispatch(clearQuery({ name: 'UserList'}))
        }
    }, [ searchParams ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    let content = ( <Spinner local={ true } /> )
    if ( users ) {
        const userBadges = []
        for( const user of users) {
            userBadges.push(<div key={user.id} className="badge-wrapper"><UserBadge id={user.id} /></div>)
        }
        content = userBadges
    } else if (request && request.state == 'fulfilled') {
        content = 'No users found.'
    } 

    const newestParams = new URLSearchParams(searchParams.toString())
    newestParams.set('sort', 'newest')

    const reputationParams = new URLSearchParams(searchParams.toString())
    reputationParams.set('sort', 'reputation')

    const sort = searchParams.get('sort') ? searchParams.get('sort') : 'newest'
    return (
        <div className="user-list">
            <div className="header">
                <h2>Users</h2>
                <div className="controls">
                    <div className="sort">
                        <a href={`?${newestParams.toString()}`} 
                            onClick={(e) => { e.preventDefault(); setSort('newest')}} 
                            className={( sort == 'newest' ? 'selected' : '' )} >Newest</a>
                        <a href={`?${reputationParams.toString()}`} 
                            onClick={(e) => { e.preventDefault(); setSort('reputation')}} 
                            className={( sort == 'reputation' ? 'selected' : '' )} >Reputation</a>
                    </div>
                </div>
            </div>
            <div className="user-wrapper">
                { content } 
            </div>
            { meta.numberOfPages > 1 && <PaginationControls prefix={'users'} counts={meta} /> }
        </div>
    )
        
}

export default UserListView
