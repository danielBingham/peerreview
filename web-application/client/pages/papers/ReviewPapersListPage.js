import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import DraftPapersListView from '/components/papers/draft/list/DraftPapersListView'

import './ReviewPapersListPage.css'

const ReviewPapersListPage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    return (
        <div id="review-papers-list-page" className="page">
            { ! currentUser && 
            <div className="login-notice">
                <p>You must be logged in to review submitted drafts.</p>
                <p>Please <Link to="/login">login</Link> or <Link to="/register">register</Link>.</p>
            </div>
            }
            { currentUser && <DraftPapersListView /> }
        </div>
    )
}

export default ReviewPapersListPage
