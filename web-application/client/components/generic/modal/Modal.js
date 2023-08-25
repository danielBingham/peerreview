import React from 'react'
import { createPortal } from 'react-dom'

import { XCircleIcon } from '@heroicons/react/24/solid'

import './Modal.css'

const Modal = function({ isVisible, setIsVisible, className, children }) {

    const close = function(event) {
        event.preventDefault()

        setIsVisible(false)
    }

    return isVisible ? createPortal(
            <div className={`modal-wrapper ${className ? className : ''}`} >
                <div className="modal-overlay" onClick={(e) => setIsVisible(false)}></div>
                <div className="modal">
                    <a href="" onClick={close} className="close"><XCircleIcon /></a>
                    { children }
                </div>
            </div>,
            document.body
        ) : null 
}

export default Modal
