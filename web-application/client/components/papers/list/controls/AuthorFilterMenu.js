import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams, Link } from 'react-router-dom'

import { CheckIcon, XCircleIcon } from '@heroicons/react/24/solid'

import { getUsers, cleanupRequest } from '/state/users'

import { FloatingMenu, FloatingMenuHeader, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import Spinner from '/components/Spinner'

import UserSuggestions from '/components/users/input/UserSuggestions'
import UserTag from '/components/users/UserTag'

import './AuthorFilterMenu.css'

const AuthorFilterMenu = function({}) {

    // ============ Query State ===============================================
    
    const [ searchParams, setSearchParams ] = useSearchParams()
    let userIds = searchParams.getAll('authors')

    // ============ Render State ==============================================

    const [ usersInternal, setUsersInternal ] = useState([])
    
    // ============ Request Tracking =========================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    // ============ Redux State ===============================================

    const users = useSelector(function(state) {
        const results = []
        for(const id of userIds) {
            if ( state.users.dictionary[id] ) {
                results.push(state.users.dictionary[id])
            }
        }
        return results
    })

    const userSuggestions = useSelector(function(state) {
        if ( ! state.users.queries['UserSuggestions'] ) {
            return []
        }
        
        const users = []
        for( const id of state.users.queries['UserSuggestions'].list) {
            users.push(state.users.dictionary[id])
        }
        return users
    })

    // ============ Helpers and Action Handling ======================================
    
    const setUser = function(user) {
        const users = [ ...usersInternal, user ]
        setUsersInternal(users)

        searchParams.delete('authors')
        for(const user of users) {
            searchParams.append('authors', user.id)
        }
        setSearchParams(searchParams)
    }

    const removeUser = function(id) {
        const users = [ ...usersInternal.filter((u) => u.id != id) ]
        setUsersInternal(users)

        searchParams.delete('authors')
        for(const user of users) {
            searchParams.append('authors', user.id)
        }
        setSearchParams(searchParams)
    }

    // ============ Effect Handling ===========================================
    
    const dispatch = useDispatch() 

    useEffect(function() {
        const userIds = searchParams.getAll('authors')

        // We need to query for one or more of our users.
        if ( userIds.length !== users.length ) {
            setRequestId(dispatch(getUsers('UserFilterMenu', { ids: userIds }))) 
        } 
    }, [ searchParams ])

    useEffect(function() {
        if ( userIds.length == users.length ) {
            setUsersInternal(users)
        }
    }, [ request])


    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ============ Render ====================================================

    let selectedContent = ( <Spinner local={true} /> )
    if ( userIds.length == usersInternal.length ) {
        const userViews = []
        for ( const id of userIds ) {
            userViews.push(
                <FloatingMenuItem key={id} onClick={(e) => { e.preventDefault(); removeUser(id); }}  className="selected-user">
                    <CheckIcon className="check" /> <UserTag id={id} link={false} /> 
                </FloatingMenuItem>
            )
        }

        selectedContent = (
            <>
                <div className="selected-users">
                    { userViews }
                </div>
            </>
        )
    }


    let selectedView = ''
    if ( usersInternal.length ) {
        if ( usersInternal.length == 1 ) {
            selectedView = `:${usersInternal[0].name}`
        } else if ( usersInternal.length == 2 ) {
            selectedView = `:${usersInternal[0].name},${usersInternal[1].name}`
        } else {
            selectedView = `:multiple`
        }
    }

    let suggestedItems = []
    for(const user of userSuggestions ) {
        if ( ! userIds.find((id) => id == user.id) ) {
            suggestedItems.push(
                <FloatingMenuItem key={user.id} className="suggested-author" onClick={(e) => { e.preventDefault(); setUser(user); }} >
                    <UserTag id={user.id} link={false} />
                </FloatingMenuItem>
            )
        }
    }

    return (
        <FloatingMenu className="authors-filter-menu">
            <FloatingMenuTrigger>Authors{selectedView}</FloatingMenuTrigger>
            <FloatingMenuBody>
                <FloatingMenuHeader>
                    <UserSuggestions />
                </FloatingMenuHeader>
                { selectedContent }
                { suggestedItems }            
            </FloatingMenuBody>
        </FloatingMenu> 
    )

}

export default AuthorFilterMenu 
