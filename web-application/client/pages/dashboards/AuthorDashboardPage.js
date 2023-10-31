import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { DocumentCheckIcon, InboxArrowDownIcon, DocumentArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageHeaderGrid, PageHeaderControls, PageHeaderMain, PageTabBar, PageTab } from '/components/generic/Page'
import Button from '/components/generic/button/Button'

import PaperList from '/components/papers/list/PaperList'

import './AuthorDashboardPage.css'

const AuthorDashboardPage = function(props) {
    const { pageTab } = useParams()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    const navigate = useNavigate()
    useEffect(function() {
        if ( ! currentUser ) {
            navigate('/login')
        }
    }, [])

    const selectedTab = ( pageTab ? pageTab : 'drafts')

    let content = (<Spinner local={true} />)
    if ( currentUser ) {
        if ( selectedTab == 'drafts' ) { 
            content = (<PaperList  type="drafts" />)
        } else if ( selectedTab == 'preprints' ) {
            content = (<PaperList type="preprint" authors={[ currentUser.id ]} /> )
        } else if ( selectedTab == 'papers' ) {
            content = (<PaperList type="published" authors={[ currentUser.id ]} /> )
        }
    }

    return (
        <Page id="author-dashboard-page">
            <PageHeader>
                <PageHeaderGrid>
                    <PageHeaderControls>
                        <Button type="primary" onClick={(e) => navigate('/submit')}>
                            <DocumentArrowUpIcon/>New Submission
                        </Button>
                    </PageHeaderControls>
                    <PageHeaderMain>
                        <h2>Author Dashboard</h2>
                    </PageHeaderMain>
                </PageHeaderGrid>
            </PageHeader>
            <PageTabBar>
                <PageTab url="/author/drafts" tab="drafts" initial={true}>
                    <DocumentIcon/>Drafts
                </PageTab>
                <PageTab url="/author/preprints" tab="preprints">
                    <DocumentIcon/>Preprints 
                </PageTab>
                <PageTab url="/author/papers" tab="papers">
                    <DocumentCheckIcon/>Papers 
                </PageTab>
            </PageTabBar>
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )
}

export default AuthorDashboardPage
