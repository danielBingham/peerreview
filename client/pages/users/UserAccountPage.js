import React from 'react'

import UserAccountView from '/components/users/account/UserAccountView'

const UserAccountPage = function(props) {

    return (
        <div id="user-account-page">
            <UserAccountView pane={props.pane} />
        </div>
    )

}

export default UserAccountPage
