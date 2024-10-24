import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { BookOpenIcon, QueueListIcon } from '@heroicons/react/24/outline'

import { clearJournalQuery, getJournals, cleanupRequest } from '/state/journals'

import { Page, PageBody, PageHeader, PageHeaderMain, PageTabBar, PageTab } from '/components/generic/Page'

import Spinner from '/components/Spinner'

import EditorEventFeed from '/components/feeds/EditorEventFeed'
import JournalSubmissionsList from '/components/journals/submissions/JournalSubmissionsList'

import './EditorDashboardPage.css'

const EditorDashboardPage = function(props) {

    const { pageTab } = useParams()

    // ======= Request Tracking =====================================

    const [requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if (requestId) {
            return state.journals.requests[requestId]
        } else {
            null
        }
    })

    // ============ Redux State ===============================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const journalDictionary = useSelector(function(state) {
        const dictionary = {}
        if ( currentUser ) {
            for(const membership of currentUser.memberships) {
                dictionary[membership.journalId] = state.journals.dictionary[membership.journalId]
            }
        }
        return dictionary
    })

    // ============ Effect Handling ===========================================
    
    const dispatch = useDispatch()
    const navigate = useNavigate()

    useEffect(function() {
        if ( ! currentUser ) {
            navigate('/login')
        }
    }, [])

    useEffect(function() {
        const journalId = pageTab
        if ( journalId && currentUser && ! currentUser.memberships.find((m) => m.journalId == journalId && (m.permissions == 'owner' || m.permissions == 'editor')) ) {
            navigate('/edit/')
        }
    }, [ pageTab ])

    useEffect(function() {
        if ( currentUser ) {
            setRequestId(dispatch(getJournals('EditorsDashboard', { userId: currentUser.id })))
        }
    }, [ ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ============ Render ====================================================

    if ( ! request || request.state !== 'fulfilled' ) {
        return ( <Spinner /> )
    }

    const selectedTab = ( pageTab ? pageTab : 'feed' )

    console.log(currentUser)
    console.log(journalDictionary)
    const tabs = []
    for( const membership of currentUser.memberships ) {
        if ( membership.permissions == 'owner' || membership.permissions == 'editor' ) {
            tabs.push(
                <PageTab key={membership.journalId} url={`/edit/${membership.journalId}`} tab={`${membership.journalId}`}>
                    <BookOpenIcon/> { journalDictionary[membership.journalId].name }
                </PageTab>
            )
        }
    }

    let content = ( <Spinner local={true} /> ) 
    if ( selectedTab == 'feed' ) {
        content = ( <EditorEventFeed /> )
    } else {
        const journalId = pageTab
        if ( currentUser.memberships.find((m) => m.journalId == journalId && (m.permissions == 'owner' || m.permissions == 'editor')) ) {
            content = ( 
                <>
                    <div><Link to={`/journal/${journalId}`}>Go to Journal -></Link></div>
                    <JournalSubmissionsList id={journalId} /> 
                </>
            )
        } else {
            content = ( <Spinner local={true} /> )
        }
    }


    return (
        <Page id="author-dashboard-page">
            <PageHeader>
                <PageHeaderMain>
                    <h2>Editor Dashboard</h2>
                </PageHeaderMain>
            </PageHeader>
            <PageTabBar>
                <PageTab url="/edit/feed" tab="feed" initial={true}>
                    <QueueListIcon/> Feed   
                </PageTab>
                { tabs }
            </PageTabBar>
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )
}

export default EditorDashboardPage
