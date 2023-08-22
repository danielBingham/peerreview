import React from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'

import SubmitDraftForm from '/components/papers/draft/submit/SubmitDraftForm'

import Spinner from '/components/Spinner'

import './SubmitPage.css'

const SubmitPage = function(props) {
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    let content = ( <Spinner /> )
    // If we don't have a current user, then we're giving them the login
    // notice, because they aren't allowed to submit.
    if ( ! currentUser ) {
        content = ( 
            <div className="login-notice">
                <p>You must be logged in to submit a paper for publication.</p>
                <p>Please <Link to="/login">login</Link> or <Link to="/register">register</Link>.</p>
            </div>
        )
    }

    else {
        content = ( <SubmitDraftForm /> )
    }


    return (
        <div id="publish-page" className="page">
            { content }
        </div>
    )
}

export default SubmitPage 
