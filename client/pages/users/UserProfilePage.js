import React from 'react'
import { useParams } from 'react-router-dom'

import UserView from '/components/users/UserView'
import ReputationList from '/components/users/reputation/ReputationList'
import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'

const UserProfilePage = function(props) {
    const { id } = useParams()

    return (
        <div id="user-profile-page" className="page">
            <UserView id={id} />
            <ReputationList id="reputation" userId={id} />
            <PublishedPaperList authorId={ id }  />
        </div>
    )
}

export default UserProfilePage
