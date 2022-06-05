import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getAuthentication, cleanupRequest, deleteAuthentication } from '../state/authentication'


/**
 * Provides an Authentication component to be used in navigation menus.  
 *
 * No props.
 */
const UserNavigation = function(props) {
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


    // Do our cleanup in a useEffect so that we do it after rendering has
    // finished and don't cause unintended consequences or render thrashing.
    useEffect(function() {
        if (  deleteAuthenticationRequest && deleteAuthenticationRequest.state == "fulfilled") {
            dispatch(cleanupRequest({ requestId: deleteAuthenticationRequestId }))
        }
    })

    // ============= RENDER =======================
    if ( currentUser ) {
        return (
            <section className="user-navigation">
                <section className="user-controls">
                    <Link to="/submissions">submissions</Link>
                    &nbsp;
                    <Link to="/publish">publish</Link>
                </section>
                <section className="authentication">
                    <Link to={`/user/${currentUser.id}`}>{ currentUser.name }</Link>
                    &nbsp;
                    <a href="" onClick={handleLogout} >logout</a>
                </section>
            </section>
        )
    } else {
        return (
            <section className="user-navigation">
                <Link to="login">login</Link>
                &nbsp;
                <Link to="register">register</Link>
            </section>
        )
    }

}

export default UserNavigation 
