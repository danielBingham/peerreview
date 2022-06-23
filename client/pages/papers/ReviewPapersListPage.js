import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import DraftPapersAwaitingReviewListView from '/components/reviews/DraftPapersAwaitingReviewListView'

import './ReviewPapersListPage.css'

const ReviewPapersListPage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    return (
        <section id="review-papers-list-page">
            { ! currentUser && <div className="login-notice">You must be logged in to review submitted drafts.  Please <Link to="/login">login</Link> or <Link to="/register">register</Link>.</div> }
            { currentUser && <DraftPapersAwaitingReviewListView /> }
        </section>
    )
}

export default ReviewPapersListPage
