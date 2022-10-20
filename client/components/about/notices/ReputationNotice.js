import React, { useState, useEffect, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import './ReputationNotice.css'

/**
 * Show a notice asking users for support.
 *
 * @param {object} props    React props object - empty.
 */
const ReputationNotice = function(props) {

    // ======= Render State =========================================

    // ======= Request Tracking =====================================
    

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================
    

    // ======= Effect Handling ======================================


    // ======= Render ===============================================

    if ( currentUser && ! currentUser.orcidId ) {
        return (
            <div className="reputation-notice">
                <p>
Peer Review is currently in alpha.  During the alpha and initial beta period,
all activities on Peer Review (publishing, reviewing, and refereeing) will
require reputation.  Once we begin open beta, publishing will require no
existing reputation, which is how new users can begin to build reputation. We
can generate initial reputation from your existing publication record if you
connect your <a href="https://orcid.org">ORCID iD</a> to your account.  You can
connect your ORCID iD to your account on the <a href="/account/details">Account
Details</a> page.
                </p>
            </div>
        )
    } else {
        return ( null )
    }
}

export default ReputationNotice
