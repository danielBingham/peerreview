import React from 'react'
import { Link } from 'react-router-dom'

import { useSelector } from 'react-redux'

import MainNavigation from './navigation/MainNavigation'
import UserNavigation from './navigation/UserNavigation'
import AuthenticationNavigation from './navigation/AuthenticationNavigation'

import './Header.css'

const Header = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    return (
        <header>
            <section id="site-title"><Link to="/">Peer Review</Link></section>
            <section id="navigation">
                <MainNavigation />
                { currentUser && <UserNavigation /> }
                <AuthenticationNavigation />
            </section>
        </header>
    )

}

export default Header