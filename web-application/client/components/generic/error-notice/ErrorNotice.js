import React, { useState } from 'react'
import { createPortal } from 'react-dom'

import { XCircleIcon } from '@heroicons/react/24/solid'

import './ErrorNotice.css'

const ErrorNotice = function({ className, onClose, children }) {
    const [ isVisible, setIsVisible ] = useState(true)

    const close = function(event) {
        event.preventDefault()

        if ( onClose ) {
            onClose()
        }

        setIsVisible(false)
    }

    return isVisible ? createPortal(
            <div className={`error-notice ${className ? className : ''}`} >
                <a href="" onClick={close} className="close"><XCircleIcon /></a>
                { children }
            </div>,
            document.body
        ) : null 

}

export default ErrorNotice
