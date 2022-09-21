import React from 'react'
import { Link } from 'react-router-dom'

import './UserNavigation.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
const UserNavigation = function(props) {

    // ======= Render ===============================================
    
    return (
        <div id="user-navigation" className="navigation-block">
            <Link to="/review">review</Link>
            <Link to="/drafts">my drafts</Link>
            <Link to="/submit">submit</Link>
        </div>
    )

}

export default UserNavigation 
