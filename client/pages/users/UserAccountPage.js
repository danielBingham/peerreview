import React from 'react'
import { useParams } from 'react-router-dom'

import UserAccountView from '/components/users/account/UserAccountView'

import './UserAccountPage.css'

const UserAccountPage = function(props) {

    const { pane = "profile" } = useParams()

    return (
        <div id="user-account-page" className="page">
            <UserAccountView pane={pane} />
        </div>
    )

}

export default UserAccountPage
