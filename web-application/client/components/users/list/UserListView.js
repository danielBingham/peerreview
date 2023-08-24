import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { UserCircleIcon } from '@heroicons/react/24/outline'

import {getUsers, clearUserQuery, cleanupRequest } from '/state/users'

import UserBadge from '../UserBadge'

import Spinner from '/components/Spinner'
import { 
    List, 
    ListHeader, 
    ListTitle, 
    ListControls, 
    ListControl, 
    ListGridContent, 
    ListNoContent 
} from '/components/generic/list/List'
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
        for( const id of state.users.queries['UserList'].list) {
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

        params.page = searchParams.get('page')
        if ( ! params.page ) {
            params.page = 1
        }
        
        params.sort = searchParams.get('sort')
        if ( ! params.sort ) {
            params.sort = 'newest'
        }

        setRequestId(dispatch(getUsers('UserList', params)))
        return function cleanup() {
            dispatch(clearUserQuery({ name: 'UserList'}))
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
    let noContent = null

    if ( users ) {
        const userBadges = []
        for( const user of users) {
            userBadges.push(<UserBadge key={user.id} id={user.id} />)
        }
        content = userBadges
    } else if (request && request.state == 'fulfilled') {
        content = null
        noContent = (<span>No users found.</span>)
    } 

    const newestParams = new URLSearchParams(searchParams.toString())
    newestParams.set('sort', 'newest')

    const sort = searchParams.get('sort') ? searchParams.get('sort') : 'newest'
    return (
        <List className="user-list">
            <ListHeader>
                <ListTitle><UserCircleIcon/>Users</ListTitle>
                <ListControls>
                    <ListControl url={`?${newestParams.toString()}`} 
                        onClick={() => setSort('newest')} 
                        selected={sort == 'newest'} 
                        name="Newest" />
                </ListControls>
            </ListHeader>
            <ListGridContent>
                { content } 
            </ListGridContent>
            <PaginationControls meta={meta} /> 
        </List>
    )
        
}

export default UserListView
