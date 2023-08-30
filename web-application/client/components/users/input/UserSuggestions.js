import React, { useState, useEffect, useLayoutEffect, useRef, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { XCircleIcon } from '@heroicons/react/24/solid'

import { getUsers, clearUserQuery, cleanupRequest } from '/state/users'

import UserTag from '/components/users/UserTag'
import UserInvite from '/components/users/input/UserInvite'
import Spinner from '/components/Spinner'

import './UserSuggestions.css'

const UserSuggestions = function({ clear, onBlur }) {

    // ======= Render State =========================================
    
    const [userName, setUserName] = useState('')

    const [error, setError] = useState(null)

    // ======= Request Tracking =====================================
    
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.users.requests[requestId]
        }
    })

    // ======= Refs =================================================

    const timeoutId = useRef(null)
    const inputRef = useRef(null)

    // ======= Redux State ==========================================

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

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    /**
     * Clear the suggestions list.
     */
    const clearSuggestions = function() {
        dispatch(clearUserQuery({ name: 'UserSuggestions'}))
        setRequestId(null)
    }

    /**
     * Query the backend for a list of suggested users matching the given name.
     *
     * @param {string} name The name or partial name of the user we want to
     * query for.
     */
    const suggestUser = function(name) {
        // We don't want to make a new request until they've stopped typing,
        // but we don't want to show old data before the request runs.
        if ( name.length <= 0 ) {
            clearSuggestions()
        }

        if ( timeoutId.current ) {
            clearTimeout(timeoutId.current)
        }
        timeoutId.current = setTimeout(function() {
            if ( name.length > 0) {
                if ( ! requestId ) {
                    dispatch(clearUserQuery({ name: 'UserSuggestions' }))
                    setRequestId(dispatch(getUsers('UserSuggestions', {name: name})))
                } else if( request && request.state == 'fulfilled') {
                    clearSuggestions()
                    setRequestId(dispatch(getUsers('UserSuggestions', { name: name})))
                }
            } 
        }, 250)
    }

    /**
     * Handle a change in input[name="userName"].  Meant to be used in the
     * onChange event handler.
     *
     * @param {Event} event Standard Javascript event object.
     */
    const handleChange = function(event) {
        setUserName(event.target.value)
        suggestUser(event.target.value)
        setError(null)
    }

    /**
     * Append a user to the selected user list.
     *
     * @param {object} user A `user` object to append to the list of selected
     * users.
     */
    const selectUserInternal = function(user) {
        setUserName('')
        clearSuggestions()

        const error = selectUser(user)
        if ( error ) {
            setError(error)
            return
        } 
    }

    const onUserNameBlur = function(event) {
        if ( onBlur ) {
            onBlur(event) 
        }
    }

    const onUserNameFocus = function(event) {
        if ( userName.length > 0 ) {
            suggestUser(event.target.value)
        }
    }

    // ======= Effect Handling ======================================

    // Clear the user list on mount.  
    useEffect(function() {
        dispatch(clearUserQuery({ name: 'UserSuggestions' }))
    }, [])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================


    return (
        <>
            <div className="user-suggestions"> 
                    <XCircleIcon className="clear" onClick={(e) => { setUserName(''); clearSuggestions()}}  /> 
                    <input type="text" 
                        name="userName" 
                        value={userName}
                        ref={inputRef}
                        onBlur={onUserNameBlur}
                        onFocus={onUserNameFocus}
                        onChange={handleChange} 
                        autoComplete="off"
                        placeholder={`Start typing name to view suggestions...`}
                    />
            </div>
        </>
    )

}

export default UserSuggestions 
