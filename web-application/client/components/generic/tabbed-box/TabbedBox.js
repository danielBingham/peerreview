import React from 'react'

import './TabbedBox.css'

export const TabbedBox = function({ className, children }) {
    return (
        <div className={`tabbed-box ${ className ? className : '' }`}>
            { children}
        </div>
    )

}

export const TabbedBoxTab = function({ children }) {
    return (
        <div className="tabbed-box-tab">
            { children }
        </div>
    )
}

export const TabbedBoxContent = function({ children }) {
    return (
        <div className="tabbed-box-content">
            { children }
        </div>
    )
}

