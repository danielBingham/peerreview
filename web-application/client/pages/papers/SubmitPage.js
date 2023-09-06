import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import Spinner from '/components/Spinner'
import { Page, PageBody } from '/components/generic/Page'

import SubmitDraftForm from '/components/papers/draft/submit/SubmitDraftForm'

import './SubmitPage.css'

const SubmitPage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    const navigate = useNavigate()
    useEffect(function() {
        if ( ! currentUser ) {
            navigate('/login')
        }
    }, [])

    let content = ( <Spinner /> )
    if ( currentUser ) {
        content = ( <SubmitDraftForm /> )
    }

    return (
        <Page id="publish-page">
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )
}

export default SubmitPage 
