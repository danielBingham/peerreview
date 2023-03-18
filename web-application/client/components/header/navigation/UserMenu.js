import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { cleanupRequest, deleteAuthentication } from '/state/authentication'

import './UserMenu.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
const UserMenu = function(props) {

    // ======= Request Tracking =====================================

    const [ deleteAuthenticationRequestId, setDeleteAuthenticationRequestId ] = useState(null)
    const deleteAuthenticationRequest = useSelector(function(state) {
        if (deleteAuthenticationRequestId) {
            return state.authentication.requests[deleteAuthenticationRequestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    /**
     * Handle a Logout request by dispatching the appropriate action.
     *
     * TODO Track this request and show an error if the attempt to deleteAuthentication
     * fails.  Cleanup the request when we're done.
     *
     * @param {object} event - Standard event object.
     */
    const handleLogout = function(event) {
        event.preventDefault()

        setDeleteAuthenticationRequestId(dispatch(deleteAuthentication()))
    }

    // ======= Effect Handling ======================================

    // Cleanup our request tracking.
    useEffect(function() {
        return function cleanup() {
            if (  deleteAuthenticationRequestId ) {
                dispatch(cleanupRequest({ requestId: deleteAuthenticationRequestId }))
            }
        }
    }, [ deleteAuthenticationRequestId ])

    // ======= Render ===============================================
   
    const isAdmin = currentUser.permissions == 'admin' || currentUser.permissions == 'superadmin'
    return (
        <div id="user-menu" className="floating-menu" onClick={props.toggleMenu} style={{ display: ( props.visible ? 'block' : 'none' ) }} >
            <div className="menu-section">
                <div className="menu-item"><Link to="/drafts">my drafts</Link></div>
                <div className="menu-item"><Link to={`/user/${currentUser.id}`}>my profile</Link></div>
            </div>
            <div className="menu-section">
                <div className="menu-item"><Link to="/account/profile">edit profile</Link></div>
                <div className="menu-item"><Link to="/account/change-email">change email</Link></div>
                <div className="menu-item"><Link to="/account/change-password">change password</Link></div>
                <div className="menu-item"><Link to="/account/orcid">connect ORCID iD</Link></div>
                <div className="menu-item"><Link to="/account/settings">account settings</Link></div>
            </div>
            { isAdmin && <div className="menu-section admin">
                <div className="menu-item"><Link to="/admin">admin</Link></div>
            </div> }
            <div className="menu-section bottom"> 
                <div className="menu-item"><a href="" className="logout" onClick={handleLogout} >logout</a></div>
            </div>
        </div>
    )

}

export default UserMenu 
