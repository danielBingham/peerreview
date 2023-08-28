import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import DraftPapersListView from '/components/papers/draft/list/DraftPapersListView'

import './AuthorDashboardPage.css'

const AuthorDashboardPage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    return (
        <div id="author-dashboard-page" className="page">
            { ! currentUser && <div className="login-notice">You must be logged in to view your submitted drafts.  Please <Link to="/login">login</Link> or <Link to="/register">register</Link>.</div> }
            { currentUser && <DraftPapersListView type="drafts" /> }
        </div>
    )
}

export default AuthorDashboardPage
