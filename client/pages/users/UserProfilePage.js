import React from 'react'
import { useParams } from 'react-router-dom'

import UserView from '/components/users/UserView'
import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'

const UserProfilePage = function(props) {
    const { id } = useParams()

    console.log(`\n\n### UserProfilePage(${id} ###`)

    return (
        <section id="user-profile-page">
            <UserView id={id} />
            <PublishedPaperList query={ { authorId: id } } />
        </section>
    )
}

export default UserProfilePage
