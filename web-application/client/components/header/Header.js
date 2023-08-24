import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { 
    BookOpenIcon
} from '@heroicons/react/24/outline'

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


    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Render ===============================================
    
    return (
        <header>
            <div id="site-title"><Link to="/"><BookOpenIcon />JournalHub</Link><sub className="wip">( beta )</sub></div>
            <div id="navigation">
                <MainNavigation />
                { currentUser && <UserNavigation /> }
                <AuthenticationNavigation />
            </div>
        </header>
    )

}

export default Header
