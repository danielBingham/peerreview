import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { InboxIcon, BookOpenIcon } from '@heroicons/react/24/outline'

import DraftPapersListView from '/components/papers/draft/list/DraftPapersListView'

import PageTabBar from '/components/generic/pagetabbar/PageTabBar'
import PageTab from '/components/generic/pagetabbar/PageTab'
import PageHeader from '/components/generic/PageHeader'

import Spinner from '/components/Spinner'

import './ReviewPapersListPage.css'

const ReviewPapersListPage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const selectedTab = ( props.tab ? props.tab : 'submissions')

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'preprints' ) {
        content = ( <DraftPapersListView type="preprint" /> )
    } else if ( selectedTab == 'submissions' ) {
        content = ( <DraftPapersListView type="submissions" /> )
    }

    return (
        <>
            <PageHeader>
                <h2>Review Draft Papers</h2>
            </PageHeader>
            <PageTabBar>
                <PageTab url={`/review/submissions`} selected={selectedTab == 'submissions'}>
                    <InboxIcon /> Submissions
                </PageTab>
                <PageTab url={`/review/preprints`} selected={selectedTab == 'preprints'}>
                    <BookOpenIcon /> Preprints 
                </PageTab>
            </PageTabBar>
            <div id="review-papers-list-page" className="page">
                { content } 
            </div>
        </>
    )
}

export default ReviewPapersListPage
