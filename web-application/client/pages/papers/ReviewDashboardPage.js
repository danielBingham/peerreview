import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { InboxIcon, DocumentIcon} from '@heroicons/react/24/outline'

import DraftPapersListView from '/components/papers/draft/list/DraftPapersListView'

import PageTabBar from '/components/generic/pagetabbar/PageTabBar'
import PageTab from '/components/generic/pagetabbar/PageTab'
import PageHeader from '/components/generic/PageHeader'

import Spinner from '/components/Spinner'

import './ReviewDashboardPage.css'

const ReviewDashboardPage = function(props) {

    // ================ Render State ================================
    

    // ================== Request Tracking ====================================
    

    // ================= Redux State ================================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // =========== Actions and Event Handling =====================================
    

    // ================= Effect Handling =======================
    

    // ====================== Render ==========================================
    
    const selectedTab = ( props.tab ? props.tab : 'assigned')

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'preprints' ) {
        content = ( <DraftPapersListView type="preprint" /> )
    } else if ( selectedTab == 'submissions' ) {
        content = ( <DraftPapersListView type="submissions" /> )
    } else if ( selectedTab == 'assigned' ) {
        content = ( <DraftPapersListView type="assigned-review" /> )
    }

    return (
        <>
            <PageHeader>
                <h2>Review Dashboard</h2>
            </PageHeader>
            <PageTabBar>
                <PageTab url={`/review/assigned`} selected={selectedTab == 'assigned'}>
                    <InboxIcon /> Assigned to Me 
                </PageTab>
                <PageTab url={`/review/submissions`} selected={selectedTab == 'submissions'}>
                    <InboxIcon /> Open Submissions
                </PageTab>
                <PageTab url={`/review/preprints`} selected={selectedTab == 'preprints'}>
                    <DocumentIcon/> Preprints 
                </PageTab>
            </PageTabBar>
            <div id="review-papers-list-page" className="page">
                { content } 
            </div>
        </>
    )
}

export default ReviewDashboardPage
