import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'

import { useSelector } from 'react-redux'

import DraftPaperView from '/components/papers/draft/view/DraftPaperView'

import Spinner from '/components/Spinner'

const DraftPaperPage = function(props) {

    const navigate = useNavigate()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    useEffect(function() {
        if ( ! currentUser ) {
            navigate("/")
        }
    })

    if ( currentUser ) {
        return (
            <section id="draft-paper-page">
                <DraftPaperView />
            </section>
        )
    } else {
        return (
            <Spinner />
        )
    }
}

export default DraftPaperPage
