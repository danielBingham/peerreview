import React, { useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

import JournalList from '/components/journals/JournalList'

import './EditorDashboardPage.css'

const EditorDashboardPage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    useLayoutEffect(function() {
        if ( ! currentUser ) {
            navigate('/login')
        }
    }, [])

    return (
        <div id="author-dashboard-page" className="page">
            <JournalList userId={ currentUser.id} />
        </div>
    )
}

export default EditorDashboardPage
