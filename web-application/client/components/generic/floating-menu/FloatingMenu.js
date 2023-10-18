import React, { useState, useEffect, useRef, useContext, createContext, Children } from 'react'

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { XCircleIcon } from '@heroicons/react/24/solid'

export const VisibleContext = createContext(false)
export const ToggleMenuContext = createContext(null)
export const CloseOnClickContext = createContext(false)

import './FloatingMenu.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const FloatingMenu = function({ children, className, closeOnClick }) {

    // ======= Render State =========================================

    const [visible, setVisible] = useState(false)

    const menuRef = useRef(null)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================


    // ======= Actions and Event Handling ===========================
    
    const toggleMenu = function() {
        setVisible(!visible)
    }


    // ======= Effect Handling ======================================

    useEffect(function() {
        const onBodyClick = function(event) {
            if (menuRef.current && ! menuRef.current.contains(event.target) ) 
            {
                setVisible(false)
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ visible, menuRef])

    // ======= Render ===============================================
    //

    return (
        <div ref={menuRef} className={`floating-menu ${ className ? className : ''}`}>
            <VisibleContext.Provider value={visible}>
                <ToggleMenuContext.Provider value={toggleMenu}>
                    <CloseOnClickContext.Provider value={closeOnClick}>
                        { children }
                    </CloseOnClickContext.Provider>
                </ToggleMenuContext.Provider>
            </VisibleContext.Provider>
        </div>
    )

}

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const FloatingMenuTrigger = function({ className, children, showArrow }) {

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)


    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================

    // ======= Effect Handling ======================================

    // ======= Render ===============================================
 
    const doNotShowArrow = showArrow === false 

    return (
        <div className={`menu-trigger ${visible ? 'active' : '' } ${className ? className : ''}`} >
            <a href="" onClick={(e) => { e.preventDefault(); toggleMenu(); }}>{ children } { ! doNotShowArrow && (visible ? <ChevronUpIcon /> : <ChevronDownIcon />) }</a>
        </div>
    )

}

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const FloatingMenuBody = function(props) {

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)


    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================

    // ======= Effect Handling ======================================

    // ======= Render ===============================================
   
    return (
        <div className={`menu-body ${ props.className ? props.className : ''}`} style={{ display: (visible ? 'block' : 'none' ) }} >
            { props.children }
        </div>
    )

}

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const FloatingMenuHeader = function({ title, children }) {

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)


    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================

    // ======= Effect Handling ======================================

    // ======= Render ===============================================

    return (
        <div className="menu-header">
            <div className="menu-header-top">
                <div className="menu-title">{ title }</div>
                <div className="menu-escape" ><a href="" onClick={(e) => { e.preventDefault(); toggleMenu(); }}><XCircleIcon/></a></div>
            </div>
            {  Children.count(children) > 0 && <div className="menu-header-bottom">
                { children }
            </div> }
        </div>
    )

}

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const FloatingMenuItem = function(props) {

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)
    const closeOnClick = useContext(CloseOnClickContext)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================
    const onClick = function(event) {
        if ( closeOnClick === true) {
            toggleMenu(); 
        }

        if ( props.onClick ) {
            props.onClick(event); 
        }
    }

    // ======= Effect Handling ======================================

    // ======= Render ===============================================
  
    return (
        <a
            href=""
            className={ props.className ? `menu-item ${props.className}` : "menu-item"} 
            onClick={(e) => { e.preventDefault(); onClick(e); }}
        >
            { props.children }
        </a>
    )

}

