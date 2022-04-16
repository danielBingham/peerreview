import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'
import { getAuthenticated, logout } from '../state/authentication'

const AuthenticationNavigation = function(props) {

    const dispatch = useDispatch()
    const authentication = useSelector(function(state) {
        return state.authentication
    })

    if ( ! authentication.currentUser && ! authentication.getAuthenticatedUser.requested ) {
        dispatch(getAuthenticated())
    }


    const handleLogout = function(event) {
        event.preventDefault()

        dispatch(logout())
    }

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
