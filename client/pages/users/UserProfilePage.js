import React from 'react'
import { useParams } from 'react-router-dom'

import UserView from '/components/users/UserView'
import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'

const UserProfilePage = function(props) {
    const { id } = useParams()

    return (
        <div id="user-profile-page" className="page">
            <UserView id={id} />
            <PublishedPaperList query={ { authorId: id } } />
        </div>
    )
}

export default UserProfilePage
