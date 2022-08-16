import React from 'react'
import { createPortal } from 'react-dom'

import './AreYouSure.css'

const AreYouSure = function({ isVisible, action, cancel, execute  }) {

    return isVisible ? createPortal(
            <div className="modal-wrapper">
                <div className="modal-overlay" onClick={(e) => cancel()}></div>
                <div className="are-you-sure">
                    <p>Are you sure you want to {action}?</p>
                    <button onClick={(e) => cancel() }>Cancel</button> <button onClick={execute}>Yes</button>
                </div>
            </div>,
            document.body
        ) : null 
}

export default AreYouSure
