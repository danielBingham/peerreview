import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { cleanupRequest, deleteAuthentication } from '/state/authentication'

import UserTag from '/components/users/UserTag'

import './AuthenticationNavigation.css'
/**
 * Provides an Authentication component to be used in navigation menus.  
 *
 * No props.
 */
const AuthenticationNavigation = function(props) {
    const [ deleteAuthenticationRequestId, setLogoutRequestId ] = useState(null)

    const dispatch = useDispatch()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const deleteAuthenticationRequest = useSelector(function(state) {
        if (deleteAuthenticationRequestId) {
            return state.authentication.requests[deleteAuthenticationRequestId]
        } else {
            return null
        }
    })


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

    useEffect(function() {

        return function cleanup() {
            if (  deleteAuthenticationRequest ) {
                dispatch(cleanupRequest(deleteAuthenticationRequest))
            }
        }

    }, [])

    // ============= RENDER =======================
    if ( currentUser ) {
        return (
            <section id="authentication-navigation" className="navigation-block authenticated">
                <UserTag id={currentUser.id} />
                <a href="" className="logout" onClick={handleLogout} >logout</a>
            </section>
        )
    } else {
        return (
            <section id="authentication-navigation" className="navigation-block not-authenticated">
                <Link to="login">login</Link>
                <Link to="register">register</Link>
            </section>
        )
    }

}

export default AuthenticationNavigation 
