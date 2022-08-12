import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import DraftPapersListView from '/components/papers/draft/list/DraftPapersListView'

import './DraftPapersListPage.css'

const DraftPapersListPage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const query = { authorId: currentUser?.id, isDraft: true }

    return (
        <div id="draft-papers-list-page" className="page">
            { ! currentUser && <div className="login-notice">You must be logged in to view your submitted drafts.  Please <Link to="/login">login</Link> or <Link to="/register">register</Link>.</div> }
            { currentUser && <DraftPapersListView query={query} /> }
        </div>
    )
}

export default DraftPapersListPage
