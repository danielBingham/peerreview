import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import CreateJournalForm from '/components/journals/CreateJournalForm'

import Spinner from '/components/Spinner'
import { Page, PageBody } from '/components/generic/Page'

import './CreateJournalPage.css'

const CreateJournalPage = function(props) {
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
        content = ( <CreateJournalForm /> )
    }

    return (
        <Page id="create-journal-page">
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )
}

export default CreateJournalPage 
