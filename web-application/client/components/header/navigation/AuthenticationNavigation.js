import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {  Link } from 'react-router-dom'

import UserTag from '/components/users/UserTag'
import UserMenu from './UserMenu'

import { ChevronDoubleDownIcon, BarsArrowDownIcon, BarsArrowUpIcon } from '@heroicons/react/24/solid'

import './AuthenticationNavigation.css'

/**
 * Provides an Authentication component to be used in navigation menus.  
 *
 * @param {object} props    Standard React props object - empty.
 */
const AuthenticationNavigation = function(props) {
    
    const [ menuVisible, setMenuVisible ] = useState(false)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const toggleMenu = function(event) {
        event.preventDefault()
        event.stopPropagation()

        setMenuVisible( ! menuVisible )
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        const onBodyClick = function(event) {
            if ( ! event.target.matches('#authentication-navigation') 
                && ! event.target.matches('#authentication-navigation:scope') ) 
            {
                setMenuVisible(false)
            } 
        }
        document.body.addEventListener('click', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('click', onBodyClick)
        }
    }, [ menuVisible ])

    // ============= Render =======================
    
    if ( currentUser ) {
        return (
            <div id="authentication-navigation" className="navigation-block authenticated">
                <span className="logged-in-user"><a href="" onClick={toggleMenu}>{ menuVisible ? <BarsArrowUpIcon /> : <BarsArrowDownIcon /> }<UserTag id={currentUser.id} link={false} /></a></span>
                <UserMenu visible={menuVisible} toggleMenu={toggleMenu} />
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
