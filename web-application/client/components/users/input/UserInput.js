import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { getUsers, clearUserQuery, cleanupRequest } from '/state/users'

import UserTag from '/components/users/UserTag'
import UserInvite from '/components/users/input/UserInvite'
import Spinner from '/components/Spinner'

import './UserInput.css'

const UserInput = function({ onBlur, selectUser, label, explanation }) {

    // ======= Render State =========================================

    const [showInviteForm, setShowInviteForm] = useState(false)
    const [userName, setUserName] = useState('')

    const [highlightedSuggestion, setHighlightedSuggestion] = useState(0)
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
        if ( ! state.users.queries['UserInput'] ) {
            return []
        }
        
        const users = []
        for( const id of state.users.queries['UserInput'].list) {
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
        dispatch(clearUserQuery({ name: 'UserInput'}))
        setHighlightedSuggestion(0)
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
                    dispatch(clearUserQuery({ name: 'UserInput' }))
                    setRequestId(dispatch(getUsers('UserInput', {name: name})))
                } else if( request && request.state == 'fulfilled') {
                    clearSuggestions()
                    setRequestId(dispatch(getUsers('UserInput', { name: name})))
                }

                if ( highlightedSuggestion >= userSuggestions.length+1 ) {
                    setHighlightedSuggestion(0)
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
        setShowInviteForm(false)
        setUserName('')
        clearSuggestions()

        const error = selectUser(user)
        if ( error ) {
            setError(error)
            return
        } 
    }

    /**
     * Handle the keyDown event on input[name="userName"].  For "enter" we
     * want to append the highlighted user to the UserList.  For the arrow
     * keys, we want to move the highlight up and down the list of
     * suggestions.
     *
     * @param {KeyboardEvent} event A standard Javascript KeyboardEvent object.
     */
    const handleKeyDown = function(event) {
        if ( event.key == "Enter" ) {
            event.preventDefault()
            const suggestionsWrappers = document.getElementsByClassName('user-suggestions')
            const suggestions = suggestionsWrappers[0].children
            if ( highlightedSuggestion == userSuggestions.length ) {
                setShowInviteForm(true) 
                clearSuggestions()
            } else if (suggestions.length > 0) {
                selectUserInternal(userSuggestions[highlightedSuggestion])
            }
        } else if ( event.key == "ArrowDown" ) {
            event.preventDefault()
            let newHighlightedSuggestion = highlightedSuggestion+1
            if ( newHighlightedSuggestion >= userSuggestions.length+1) {
                newHighlightedSuggestion = userSuggestions.length
            }
            setHighlightedSuggestion(newHighlightedSuggestion)
        } else if ( event.key == "ArrowUp" ) {
            event.preventDefault()
            let newHighlightedSuggestion = highlightedSuggestion-1
            if ( newHighlightedSuggestion < 0) {
                newHighlightedSuggestion = 0 
            }
            setHighlightedSuggestion(newHighlightedSuggestion)
        } 
    }

    const hideInviteForm = function() {
        setShowInviteForm(false)
        clearSuggestions()
        suggestUser(userName)
        if ( inputRef.current ) {
            inputRef.current.focus()
        }
    }

    const onUserNameBlur = function(event) {
        clearSuggestions()

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
    useLayoutEffect(function() {
        dispatch(clearUserQuery({ name: 'UserInput' }))
    }, [])

    // Make sure the highlightedSuggestion is never outside the bounds of the
    // userSuggestions list (plus the user invite selection).
    useLayoutEffect(function() {
        if ( highlightedSuggestion >= userSuggestions.length+1 && highlightedSuggestion != 0) {
            setHighlightedSuggestion(0)
        }
    }, [ highlightedSuggestion, userSuggestions ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    let suggestedUserList = []
    let suggestionsError = null
    if ( request && request.state != 'failed') {
        for ( const [ index, user ] of userSuggestions.entries()) {
            suggestedUserList.push(
                <div key={user.id} 
                    onMouseDown={(event) => { selectUserInternal(user) }}
                    onMouseOver={(event) => { setHighlightedSuggestion(index) }}
                    className={ index == highlightedSuggestion ? "user-suggestion highlighted" : "user-suggestion" }
                >
                    <UserTag id={user.id} link={false}/>
                </div>
            )
        }

        let index = suggestedUserList.length
        suggestedUserList.push(
            <div key="user-invite"
                onMouseDown={(event) => { 
                    setShowInviteForm(true) 
                    clearSuggestions()
                }} 
                onMouseOver={(event) => { setHighlightedSuggestion(index) }}
                className={ index == highlightedSuggestion ? "user-suggestion highlighted" : "user-suggestion" }
            >
                Invite User 
            </div>
        )

    } else if ( request && request.state == 'failed' ) {
        suggestionsError = (
            <div className="error">
                The attempt to retrieve user suggestions from the backend
                failed with error: { request.error }. Please report this as a
                bug.
            </div>
        )
    } 

    let errorView = null
    if ( error ) {
        errorView = ( <div className="error">{ error }</div> )
    }


    let inviteForm = null
    if ( showInviteForm ) {
        inviteForm = ( <UserInvite initialName={userName} hideInviteForm={hideInviteForm} setInvitedUser={selectUserInternal} /> )
    }

    return (
        <>
            <div className="users-input field-wrapper"> 
                { label && <label htmlFor="userName">{ label }</label> }
                { explanation && <div className="explanation">{ explanation }</div> }
                <div className="input-wrapper">
                    <input type="text" 
                        name="userName" 
                        value={userName}
                        ref={inputRef}
                        onKeyDown={handleKeyDown}
                        onBlur={onUserNameBlur}
                        onFocus={onUserNameFocus}
                        onChange={handleChange} 
                        placeholder={`Search for users by name. Start typing to view suggestions...`}
                        autoComplete="off"
                    />
                    <div className="user-suggestions" 
                        style={ ( suggestedUserList.length > 0 || suggestionsError ? { display: 'block' } : { display: 'none' } ) }
                    >
                        { suggestionsError }
                        { suggestedUserList }
                    </div>
                </div>
                { errorView }
            </div>
            { inviteForm }
        </>
    )

}

export default UserInput
