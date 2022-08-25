import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {  Link } from 'react-router-dom'

import { cleanupRequest, deleteAuthentication } from '/state/authentication'

import UserTag from '/components/users/UserTag'

import './AuthenticationNavigation.css'

/**
 * Provides an Authentication component to be used in navigation menus.  
 *
 * @param {object} props    Standard React props object - empty.
 */
const AuthenticationNavigation = function(props) {

    // ======= Request Tracking =====================================

    const [ deleteAuthenticationRequestId, setDeleteAuthenticationRequestId ] = useState(null)
    const deleteAuthenticationRequest = useSelector(function(state) {
        if (deleteAuthenticationRequestId) {
            return state.authentication.requests[deleteAuthenticationRequestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

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

        setDeleteAuthenticationRequestId(dispatch(deleteAuthentication()))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( deleteAuthenticationRequestId && ! deleteAuthenticationRequest) {
            window.location.href= "/" 
        }
    }, [deleteAuthenticationRequest])

    // Cleanup our request tracking.
    useEffect(function() {
        return function cleanup() {
            if (  deleteAuthenticationRequestId ) {
                dispatch(cleanupRequest({ requestId: deleteAuthenticationRequestId }))
            }
        }
    }, [ deleteAuthenticationRequestId ])

    // ============= Render =======================
    
    if ( currentUser ) {
        return (
            <div id="authentication-navigation" className="navigation-block authenticated">
                <UserTag id={currentUser.id} />
                <a href="" className="logout" onClick={handleLogout} >logout</a>
            </div>
        )
    } else {
        return (
            <div id="authentication-navigation" className="navigation-block not-authenticated">
                <Link to="login">login</Link>
                <Link to="register">register</Link>
            </div>
        )
    }

}

export default AuthenticationNavigation 
