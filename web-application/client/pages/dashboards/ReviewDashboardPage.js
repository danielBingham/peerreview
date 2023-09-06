import React from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'

import { InboxIcon, DocumentIcon} from '@heroicons/react/24/outline'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageTabBar, PageTab } from '/components/generic/Page'

import PaperList from '/components/papers/list/PaperList'

import './ReviewDashboardPage.css'

const ReviewDashboardPage = function(props) {

    const { pageTab } = useParams()

    // ================ Render State ================================
    

    // ================== Request Tracking ====================================
    

    // ================= Redux State ================================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // =========== Actions and Event Handling =====================================
    

    // ================= Effect Handling =======================
    

    // ====================== Render ==========================================
    
    const selectedTab = ( pageTab ? pageTab : 'assigned')

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'preprints' ) {
        content = ( <PaperList type="preprint" /> )
    } else if ( selectedTab == 'submissions' ) {
        content = ( <PaperList type="review-submissions" /> )
    } else if ( selectedTab == 'assigned' ) {
        content = ( <PaperList type="assigned-review" /> )
    } else {
        content = ( <PaperList type="assigned-review" /> )
    }


    return (
        <Page id="review-dashboard">
            <PageHeader>
                <h2>Review Dashboard</h2>
            </PageHeader>
            <PageTabBar>
                <PageTab url={`/review/assigned`} tab="assigned" initial={true}>
                    <InboxIcon /> Assigned to Me 
                </PageTab>
                <PageTab url={`/review/submissions`} tab="submissions">
                    <InboxIcon /> Open Submissions
                </PageTab>
                <PageTab url={`/review/preprints`} tab="preprints">
                    <DocumentIcon/> Preprints 
                </PageTab>
            </PageTabBar>
            <PageBody>
                { content } 
            </PageBody>
        </Page>
    )
}

export default ReviewDashboardPage
