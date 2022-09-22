import React from 'react'
import { useSelector } from 'react-redux'

import './NeedEmailConfirmationNotice.css'

/**
 * Show a notice welcoming the user to Peer Review, giving a short explanation
 * of what it is, and linking them to more documentation.
 *
 * @param {object} props    Standard react props - empty.
 */
const NeedEmailConfirmationNotice = function(props) {

    // ======= Render State =========================================

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================
    

    // ======= Render ===============================================
    
    if ( currentUser.status != 'confirmed') {
        return (
            <div className="need-email-confirmation">
                <p>You have not yet confirmed your email.  Please check your email and follow the instructions you received to confirm!</p>
            </div>
        )
    } else {
        return (null) 
    }
}

export default NeedEmailConfirmationNotice


