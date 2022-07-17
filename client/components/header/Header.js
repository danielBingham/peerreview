import React from 'react'
import { Link } from 'react-router-dom'

import { useSelector } from 'react-redux'

import MainNavigation from './navigation/MainNavigation'
import UserNavigation from './navigation/UserNavigation'
import AuthenticationNavigation from './navigation/AuthenticationNavigation'

import './Header.css'

/**
 * A component to render the site header.
 *
 * @param {object} props    Standard react props object - empty.
 */
const Header = function(props) {

    // ======= Render ===============================================
    
    return (
        <header>
            <div id="site-title"><Link to="/"><img src="/img/icon.svg" /> Peer Review</Link></div>
            <div id="navigation">
                <MainNavigation />
                <UserNavigation /> 
                <AuthenticationNavigation />
            </div>
        </header>
    )

}

export default Header
