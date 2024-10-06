import React, { useState, useEffect, useRef, useContext, createContext, Children } from 'react'

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { XCircleIcon } from '@heroicons/react/24/solid'

export const VisibleContext = createContext(false)
export const ToggleMenuContext = createContext(null)

import './Select.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const Select = function({ children, className, closeOnClick }) {

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
        <div ref={menuRef} className={`select ${ className ? className : ''}`}>
            <VisibleContext.Provider value={visible}>
                <ToggleMenuContext.Provider value={toggleMenu}>
                    { children }
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
export const SelectTrigger = function({ className, children, showArrow }) {

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
        <div className={`select-trigger ${visible ? 'active' : '' } ${className ? className : ''}`} >
            <a href="" onClick={(e) => { e.preventDefault(); toggleMenu(); }}>{ children } { ! doNotShowArrow && (visible ? <ChevronUpIcon /> : <ChevronDownIcon />) }</a>
        </div>
    )

}

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const SelectBody = function(props) {

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)


    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================

    // ======= Effect Handling ======================================

    // ======= Render ===============================================
   
    return (
        <div className={`select-body ${ props.className ? props.className : ''}`} style={{ display: (visible ? 'block' : 'none' ) }} >
            { props.children }
        </div>
    )

}


/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const SelectItem = function(props) {

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================
    const onClick = function(event) {
        toggleMenu(); 

        if ( props.onClick ) {
            props.onClick(event); 
        }
    }

    // ======= Effect Handling ======================================

    // ======= Render ===============================================
  
    return (
        <a
            href=""
            className={ props.className ? `select-item ${props.className}` : "select-item"} 
            onClick={(e) => { e.preventDefault(); onClick(e); }}
        >
            { props.children }
        </a>
    )

}

