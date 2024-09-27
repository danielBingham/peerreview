import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {  Link } from 'react-router-dom'

import { 
    ChevronUpIcon, 
    ChevronDownIcon, 
    DocumentIcon,
    ClipboardDocumentIcon,
    PencilSquareIcon,
    CommandLineIcon,
    InboxStackIcon
} from '@heroicons/react/24/outline'

import './DashboardsNavigation.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
const DashboardsNavigation = function(props) {

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
        <div ref={menuRef} id="dashboards-navigation" className="navigation-block">
            <span className="dashboards-menu-trigger">
                <a href="" onClick={toggleMenu}><InboxStackIcon/>Dashboards{ menuVisible ? <ChevronUpIcon className="arrow" /> : <ChevronDownIcon className="arrow" /> }</a>
            </span>
            <div id="dashboards-menu" className="floating-menu" style={{ display: ( menuVisible ? 'block' : 'none' ) }} >
                <div className="menu-item" onClick={toggleMenu}><Link to="/author"><DocumentIcon/>Author</Link></div>
                <div className="menu-item" onClick={toggleMenu}><Link to="/review"><ClipboardDocumentIcon />Reviewer</Link></div>
                <div className="menu-item" onClick={toggleMenu}><Link to="/edit"><PencilSquareIcon/>Editor</Link></div>
            </div>
        </div>
    )

}

export default DashboardsNavigation 
