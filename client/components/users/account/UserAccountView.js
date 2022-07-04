import React from 'react'
import { Link } from 'react-router-dom'

import UserProfileEditForm from './UserProfileEditForm'

import './UserAccountView.css'

const UserAccountView = function(props) {

    let pane = null
    if ( props.pane == 'profile' ) {
        pane = ( <UserProfileEditForm /> )
    }

    return (
        <div className="user-account-view">
            <div className="nav-wrapper">
                <nav>
                    <div className="pane-link selected"><Link to="/user/account/profile">Profile</Link></div>
                    <div className="pane-link"><Link to="/user/account/details">Account Details</Link></div>
                    <div className="pane-link"><Link to="/user/account/settings">Settings</Link></div>
                </nav>
            </div>
            <div className="pane">
                { pane } 
            </div>
        </div>
    )
}

export default UserAccountView
