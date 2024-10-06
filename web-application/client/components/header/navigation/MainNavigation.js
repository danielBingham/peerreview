import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {  Link } from 'react-router-dom'

import { 
    HomeIcon,
    ChevronUpIcon, 
    ChevronDownIcon, 
    BookOpenIcon, 
    TagIcon, 
    UserCircleIcon, 
    DocumentIcon,
    DocumentCheckIcon,
    QuestionMarkCircleIcon,
    NewspaperIcon
} from '@heroicons/react/24/outline'
import { GlobeAltIcon } from '@heroicons/react/24/outline'

import './MainNavigation.css'

/**
 * Display primary navigation for the site.
 *
 * @param {object} props    The standard React props object - empty in this case.
 */ 
const MainNavigation = function(props) {

    const [ menuVisible, setMenuVisible ] = useState(false)

    const menuRef = useRef(null)

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    const toggleMenu = function(event) {
        event.preventDefault()

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

    // ======= Render ===============================================

    return (
        <>
            <div id="about-navigation" className="navigation-block">
                <Link to="/"><HomeIcon />Home</Link>
                <Link to="/about"><QuestionMarkCircleIcon />About</Link>
                <a href="https://blog.peer-review.io"><NewspaperIcon />News</a>
            </div>
            <div ref={menuRef} id="main-navigation" className="navigation-block">
                <span className="explore-menu-trigger"><a href="" onClick={toggleMenu}><GlobeAltIcon />Explore{ menuVisible ? <ChevronUpIcon className="arrow" /> : <ChevronDownIcon className="arrow" /> }</a></span>
                <div id="explore-menu" className="floating-menu" style={{ display: ( menuVisible ? 'block' : 'none' ) }} >
                    <div className="menu-item" onClick={toggleMenu}><Link to="/"><DocumentCheckIcon />Papers</Link></div>
                    <div className="menu-item" onClick={toggleMenu}><Link to="/preprints"><DocumentIcon/>Preprints</Link></div>
                    <div className="menu-item" onClick={toggleMenu}><Link to="/journals"><BookOpenIcon />Journals</Link></div>
                    <div className="menu-item" onClick={toggleMenu}><Link to="/fields"><TagIcon />Taxonomy</Link></div>
                    <div className="menu-item" onClick={toggleMenu}><Link to="/users"><UserCircleIcon />Users</Link></div>
                </div>
            </div>
        </>
    )

}

export default MainNavigation 
