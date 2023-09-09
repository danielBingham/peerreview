import React  from 'react'

import './Timeline.css'

export const Timeline = function({ className, children }) {
    return (
        <div className={`timeline ${className ? className : ''}`}>
            { children }
        </div>
    )

}

export const TimelineItem = function({ className, children }) {
    return (
        <div className={`timeline-item ${className ? className : ''}`}>
            { children }
        </div>
    )
}

export const TimelineIcon = function({ className, children }) {
    return (
        <div className={`timeline-icon ${className ? className : ''}`}>
            { children }
        </div>
    )
}
export const TimelineItemWrapper = function({ className, children }) {
    return (
        <div className={`timeline-item-wrapper ${className ? className : ''}`}>
            { children }
        </div>
    )
}


