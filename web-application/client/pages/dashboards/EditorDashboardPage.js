import React, { useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

import { BookOpenIcon } from '@heroicons/react/24/outline'

import { Page, PageBody, PageHeader, PageHeaderMain, PageTabBar, PageTab } from '/components/generic/Page'

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
        <Page id="author-dashboard-page">
            <PageHeader>
                <PageHeaderMain>
                    <h2>Editor Dashboard</h2>
                </PageHeaderMain>
            </PageHeader>
            <PageTabBar>
                <PageTab url="/edit/journals" tab="journals" initial={true}>
                    <BookOpenIcon/>Journals
                </PageTab>
            </PageTabBar>
            <PageBody>
                <JournalList userId={ currentUser.id} />
            </PageBody>
        </Page>
    )
}

export default EditorDashboardPage
