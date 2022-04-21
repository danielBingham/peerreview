import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'
import { getAuthenticatedUser, cleanupRequest, logout } from '../state/authentication'


/**
 * Provides an Authentication component to be used in navigation menus.  
 *
 * No props.
 */
const AuthenticationNavigation = function(props) {
    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()
    const authentication = useSelector(function(state) {
        return state.authentication
    })

    // We need to request the authenticated user from the backend to determine
    // whether or not we have an existing session.  We only want to do this
    // once, so we'll hang on to the requestId to track the request -- and
    // after we're done to remember that we've made the request.
    if ( ! requestId ) {
        setRequestId(dispatch(getAuthenticatedUser()))
    } else if ( requestId && authentication.requests[requestId] ) {
        // If we've made the request and it still exists, but is complete, then
        // we need to cleanup.  
        if ( authentication.requests[requestId].completed) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }

    /**
     * Handle a Logout request by dispatching the appropriate action.
     *
     * TODO Track this request and show an error if the attempt to logout
     * fails.  Cleanup the request when we're done.
     */
    const handleLogout = function(event) {
        event.preventDefault()

        dispatch(logout())
    }

    // ============= RENDER =======================
    if ( authentication.currentUser ) {
        return (
            <section className="authentication">
                <Link to="profile">{ authentication.currentUser.name }</Link>
                &nbsp;
                <a href="" onClick={handleLogout} >logout</a>
            </section>
        )
    } else {
        return (
            <section className="authentication">
                <Link to="login">login</Link>
                &nbsp;
                <Link to="register">register</Link>
            </section>
        )
    }

}

export default AuthenticationNavigation
