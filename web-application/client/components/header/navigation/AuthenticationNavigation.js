import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {  Link } from 'react-router-dom'

import UserTag from '/components/users/UserTag'
import UserMenu from './UserMenu'

import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid'

import './AuthenticationNavigation.css'

/**
 * Provides an Authentication component to be used in navigation menus.  
 *
 * @param {object} props    Standard React props object - empty.
 */
const AuthenticationNavigation = function(props) {
    
    const [ menuVisible, setMenuVisible ] = useState(false)

    const menuRef = useRef(null)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const toggleMenu = function(event) {
        setMenuVisible( ! menuVisible )
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        const onBodyClick = function(event) {
            if ( menuRef.current && ! menuRef.current.contains(event.target) ) {
                setMenuVisible(false)
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ menuVisible, menuRef ])

    // ============= Render =======================
    
    if ( currentUser ) {
        return (
            <div ref={menuRef} id="authentication-navigation" className="navigation-block authenticated">
                <span className="logged-in-user"><span href="" onClick={toggleMenu}>{ menuVisible ? <ChevronUpIcon/> : <ChevronDownIcon /> }<UserTag id={currentUser.id} link={false} /></span></span>
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
