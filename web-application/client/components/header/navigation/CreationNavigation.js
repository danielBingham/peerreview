import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {  Link } from 'react-router-dom'

import { 
    ChevronUpIcon, 
    ChevronDownIcon, 
    DocumentIcon,
    DocumentArrowUpIcon, 
    BookOpenIcon, 
    PlusIcon,
    PlusCircleIcon,
    ClipboardDocumentIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline'

import './CreationNavigation.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
const CreationNavigation = function(props) {

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
        <div ref={menuRef} id="creation-navigation" className="navigation-block">
            <span className="creation-menu-trigger">
                <a href="" onClick={toggleMenu}><PlusCircleIcon />New{ menuVisible ? <ChevronUpIcon className="arrow" /> : <ChevronDownIcon className="arrow" /> }</a>
            </span>
            <div id="creation-menu" className="floating-menu" style={{ display: ( menuVisible ? 'block' : 'none' ) }} >
                <div className="menu-item" onClick={toggleMenu}><Link to="/submit"><DocumentArrowUpIcon />New Submission</Link></div>
                <div className="menu-item" onClick={toggleMenu}><Link to="/create"><BookOpenIcon />New Journal</Link></div>
            </div>
        </div>
    )

}

export default CreationNavigation 
