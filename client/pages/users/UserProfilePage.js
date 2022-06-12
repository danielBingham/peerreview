import React from 'react'
import { useParams } from 'react-router-dom'

import UserProfileView from '/components/users/UserProfileView'

const UserProfilePage = function(props) {
    const { id } = useParams()

    return (
        <section id="user-profile-page">
            <UserProfileView id={id} />
        </section>
    )
}

export default UserProfilePage
