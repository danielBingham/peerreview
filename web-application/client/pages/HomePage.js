import React, { useState, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'

import { 
    DocumentCheckIcon, 
    DocumentArrowUpIcon,
    DocumentIcon, 
    BookOpenIcon, 
    TagIcon, 
    UserCircleIcon 
} from '@heroicons/react/24/outline'

import { 
    Page, 
    PageBody, 
    PageTabBar, 
    PageTab, 
    PageHeader, 
    PageHeaderGrid, 
    PageHeaderControls 
} from '/components/generic/Page'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import PaperList from '/components/papers/list/PaperList'
import FieldListView from '/components/fields/list/FieldListView'
import JournalList from '/components/journals/JournalList'
import UserListView from '/components/users/list/UserListView'

import PaperSearchView from '/components/papers/search/PaperSearchView'
import WelcomeNotice from '/components/about/notices/WelcomeNotice'
import SupportNotice from '/components/about/notices/SupportNotice'
import WIPNotice from '/components/about/notices/WIPNotice'


import './HomePage.css'

const HomePage = function(props) {
   
    const { pageTab } = useParams()

    const [ query, setQuery ] = useState({})

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const selectedTab = ( pageTab ? pageTab : 'papers')

    let content = ( <Spinner />)
    if ( selectedTab == 'papers' ) {
        content = (
            <>
                <PaperSearchView />
                <PaperList type="published" query={query} />
            </>
        )
    } else if ( selectedTab == 'preprints' ) {
        content = ( <PaperList type="preprint" /> )
    } else if (selectedTab == 'journals' ) {
        content = ( <JournalList /> )
    } else if ( selectedTab == 'fields' ) {
        content = ( <FieldListView title={ 'Taxonomy' } /> )
    } else if ( selectedTab == 'users' ) {
        content = ( <UserListView /> )
    }

    const navigate = useNavigate()
    return (
        <Page id="home-page">
            <PageHeader>
                <PageHeaderGrid>
                { currentUser && <PageHeaderControls>
                    <Button type="secondary" onClick={(e) => navigate('/create')}>
                        <BookOpenIcon/>New Journal
                    </Button>
                    <Button type="primary" onClick={(e) => navigate('/submit')}>
                        <DocumentArrowUpIcon/>New Submission
                    </Button>
                </PageHeaderControls> }
                </PageHeaderGrid>
            </PageHeader>
            <PageTabBar>
                <PageTab url="/papers" tab="papers" initial={true}>
                    <DocumentCheckIcon/>Papers 
                </PageTab>
                <PageTab url="/preprints" tab="preprints">
                    <DocumentIcon/>Preprints 
                </PageTab>
                <PageTab url="/journals" tab="journals">
                    <BookOpenIcon/>Journals
                </PageTab>
                <PageTab url="/fields" tab="fields">
                    <TagIcon/>Taxonomy
                </PageTab>
                <PageTab url="/users" tab="users">
                    <UserCircleIcon/>Users
                </PageTab>
            </PageTabBar>
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )
}

export default HomePage
