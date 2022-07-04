import React from 'react'
import { Link, useParams } from 'react-router-dom'

import UserProfileEditForm from './UserProfileEditForm'
import UserAccountDetailsForm from './UserAccountDetailsForm'

import './UserAccountView.css'

const UserAccountView = function(props) {

    const { pane } = useParams()

    let content = null
    if ( ! pane || pane == 'profile' ) {
        content = ( <UserProfileEditForm /> )
    } else if ( pane == 'details' ) {
        content = ( <UserAccountDetailsForm /> )
    }

    return (
        <div className="user-account-view">
            <div className="nav-wrapper">
                <nav>
                    <div className={ pane == 'profile' ? "pane-link selected" : "pane-link" }>
                        <Link to="/account/profile">Profile</Link>
                    </div>
                    <div className={ pane == 'details' ? "pane-link selected" : "pane-link" }>
                        <Link to="/account/details">Account Details</Link>
                    </div>
                    <div className="pane-link"><Link to="/account/settings">Settings</Link></div>
                </nav>
            </div>
            <div className="pane">
                { content }
            </div>
        </div>
    )
}

export default UserAccountView
