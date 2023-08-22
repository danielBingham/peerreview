import React  from 'react'

import './Timeline.css'

export const Timeline = function({ children }) {
    return (
            <div className="timeline">
                { children }
            </div>

    )

}

export const TimelineItem = function({ children }) {
    return (
        <div className="timeline-item">
            { children }
        </div>
    )
}

export const TimelineIcon = function({ children }) {
    return (
        <div className="timeline-icon">
            { children }
        </div>
    )
}
export const TimelineItemWrapper = function({ children }) {
    return (
        <div className="timeline-item-wrapper">
            { children }
        </div>
    )
}


