import React, { useState, useEffect, useRef, useContext, createContext } from 'react'

import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline'

export const VisibleContext = createContext(false)
export const ToggleMenuContext = createContext(null)

import './FloatingMenu.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const FloatingMenu = function(props) {

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

    let className = 'floating-menu'
    if ( props.className ) {
        className = `floating-menu ${props.className}`
    }

    return (
        <div ref={menuRef} className={ className }>
            <VisibleContext.Provider value={visible}>
                <ToggleMenuContext.Provider value={toggleMenu}>
                    { props.children }
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
export const FloatingMenuTrigger = function(props) {

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)


    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================

    // ======= Effect Handling ======================================

    // ======= Render ===============================================
   
    return (
        <div className={visible ? "menu-trigger active" : "menu-trigger" } onClick={toggleMenu} >
            { props.children } { visible ? <ChevronUpIcon /> : <ChevronDownIcon /> }
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
        <div className="menu-body" style={{ display: (visible ? 'block' : 'none' ) }} >
            { props.children }
        </div>
    )

}

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const FloatingMenuHeader = function(props) {

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
            <div className="menu-title">{ props.children }</div>
            <div className="menu-escape" onClick={toggleMenu} ><XMarkIcon /></div>
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

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================
    const onClick = function(event) {
        if ( props.closeOnClick === true) {
            toggleMenu(); 
        }

        props.onClick(event); 
    }

    // ======= Effect Handling ======================================

    // ======= Render ===============================================
  
    return (
        <div 
            className={ props.className ? `menu-item ${props.className}` : "menu-item"} 
            onClick={onClick}
        >
            { props.children }
        </div>
    )

}

