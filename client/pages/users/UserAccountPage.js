import React from 'react'
import { useSelector} from 'react-redux'
import { useParams, Link } from 'react-router-dom'

import UserAccountView from '/components/users/account/UserAccountView'

import './UserAccountPage.css'

const UserAccountPage = function(props) {

    const { pane = "profile" } = useParams()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    return (
        <div id="user-account-page" className="page">
            { currentUser && <UserAccountView pane={pane} /> }
            { ! currentUser && 
                <div className="login-notice">
                    <p>You must be logged in to view the account page.</p>
                    <p>Please <Link to="/login">login</Link> or <Link to="/register">register</Link>.</p>
                </div> }
        </div>
    )

}

export default UserAccountPage
