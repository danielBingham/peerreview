import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useSelector } from 'react-redux'

import DraftPaperView from '/components/papers/draft/view/DraftPaperView'

import Spinner from '/components/Spinner'

const DraftPaperPage = function(props) {

    const navigate = useNavigate()
    const { id, versionNumber } = useParams()

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
            <div id="draft-paper-page" className="page">
                <DraftPaperView id={id} versionNumber={versionNumber} />
            </div>
        )
    } else {
        return (
            <Spinner />
        )
    }
}

export default DraftPaperPage
