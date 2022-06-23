import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import SubmitDraftForm from '/components/papers/draft/submit/SubmitDraftForm'

import './PublishPage.css'

const PublishPage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    return (
        <section id="publish-page">
            { ! currentUser && <div className="login-notice">You must be logged in to submit a paper for publication.  Please <Link to="/login">login</Link> or <Link to="/register">register</Link>.</div> }
            { currentUser && <SubmitDraftForm /> }
        </section>
    )
}

export default PublishPage
