import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getAuthentication, cleanupRequest, deleteAuthentication } from '../state/authentication'


/**
 * Provides an Authentication component to be used in navigation menus.  
 *
 * No props.
 */
const AuthenticationNavigation = function(props) {
    const [ getAuthenticationRequestId, setGetAuthenticationRequestId ] = useState(null)
    const [ deleteAuthenticationRequestId, setLogoutRequestId ] = useState(null)

    const dispatch = useDispatch()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const authenticationRequest = useSelector(function(state) {
        if (getAuthenticationRequestId) {
            return state.authentication.requests[getAuthenticationRequestId]
        } else {
            return null
        }
    })

    const deleteAuthenticationRequest = useSelector(function(state) {
        if (deleteAuthenticationRequestId) {
            return state.authentication.requests[deleteAuthenticationRequestId]
        } else {
            return null
        }
    })

    // We need to request the authenticated user from the backend to determine
    // whether or not we have an existing session.  We only want to do this
    // once, so we'll hang on to the getAuthenticationRequestId to track the request -- and
    // after we're done to remember that we've made the request.
    if ( ! currentUser && ! getAuthenticationRequestId ) {
        setGetAuthenticationRequestId(dispatch(getAuthentication()))
    } 



    /**
     * Handle a Logout request by dispatching the appropriate action.
     *
     * TODO Track this request and show an error if the attempt to deleteAuthentication
     * fails.  Cleanup the request when we're done.
     *
     * @param {object} event - Standard event object.
     */
    const handleLogout = function(event) {
        event.preventDefault()

        setLogoutRequestId(dispatch(deleteAuthentication()))
    }


    // Do our cleanup in a useEffect so that we do it after rendering has
    // finished and don't cause unintended consequences or render thrashing.
    useEffect(function() {

        // If we've made the request and it still exists, but is complete, then
        // we need to cleanup.  
        if (  authenticationRequest && authenticationRequest.state == "fulfilled") {
            dispatch(cleanupRequest({ requestId: getAuthenticationRequestId }))
        }

        if (  deleteAuthenticationRequest && deleteAuthenticationRequest.state == "fulfilled") {
            dispatch(cleanupRequest({ requestId: deleteAuthenticationRequestId }))
        }
    })

    // ============= RENDER =======================
    if ( currentUser ) {
        return (
            <section className="authentication">
                <Link to="profile">{ currentUser.name }</Link>
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
