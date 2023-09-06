import React, { useState, useEffect, useRef, useContext, createContext } from 'react'

import Button from '/components/generic/button/Button'

import './ButtonWithModal.css'

export const VisibleContext = createContext(false)
export const ToggleModalContext = createContext(null)

export const ButtonWithModal = function({ className, children }) {

    // ======= Render State =========================================

    const [visible, setVisible] = useState(false)

    const modalRef = useRef(null)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================


    // ======= Actions and Event Handling ===========================
    
    const toggleModal = function() {
        setVisible(!visible)
    }


    // ======= Effect Handling ======================================

    useEffect(function() {
        const onBodyClick = function(event) {
            if (modalRef.current && ! modalRef.current.contains(event.target) ) 
            {
                setVisible(false)
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ visible, modalRef])

    // ======= Render ===============================================
    //
    return (
        <div ref={modalRef} className={`button-with-modal ${className ? className : ''} `}>
            <VisibleContext.Provider value={visible}>
                <ToggleModalContext.Provider value={toggleModal}>
                    { children }
                </ToggleModalContext.Provider>
            </VisibleContext.Provider>
        </div>
    )
}

export const ModalButton = function({ type, disabled, className, children }) {

    const visible = useContext(VisibleContext)
    const toggleModal = useContext(ToggleModalContext)

    return (
        <Button
            type={type}
            className={`modal-button ${ type ? type : 'default' } ${ className ? className : '' }`} 
            onClick={(e) => {
                e.preventDefault()

                toggleModal()
            }}
            disabled={disabled}
        >
            { children }
            <div className="arrow-wrapper">
                <div className="arrow">
                </div>
            </div>
        </Button>
    )
}

export const ButtonModal = function({ className, children }) {

    const visible = useContext(VisibleContext)
    const toggleModal = useContext(ToggleModalContext)

    return (
        <div 
            className={`button-modal ${className ? className : ''}`}
            style={{ display: (visible ? 'block' : 'none' ) }}
        >
            { children }
        </div>
    )

}


