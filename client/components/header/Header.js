import React from 'react'
import { Link } from 'react-router-dom'

import { useSelector } from 'react-redux'

import MainNavigation from './navigation/MainNavigation'
import UserNavigation from './navigation/UserNavigation'
import AuthenticationNavigation from './navigation/AuthenticationNavigation'

import './Header.css'

const Header = function(props) {

    return (
        <header>
            <section id="site-title"><Link to="/">Peer Review</Link></section>
            <section id="navigation">
                <MainNavigation />
                <UserNavigation /> 
                <AuthenticationNavigation />
            </section>
        </header>
    )

}

export default Header
