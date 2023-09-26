import React from 'react'
import { useSelector } from 'react-redux'

import { EyeIcon } from '@heroicons/react/24/outline'

import './VisibilityControl.css'

const VisibilityControl = function({ eventId }) {

    // ============ Redux State ===============================================

    const event = useSelector(function(state) {
        return state.paperEvents.dictionary[eventId]
    })

    // ============ Render ====================================================

    return (
        <div className="event-visibility-control">
            <EyeIcon/> { event.visibility.join() }
        </div>
    )

}

export default VisibilityControl
