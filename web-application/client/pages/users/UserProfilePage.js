import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import UserView from '/components/users/UserView'
import ReputationList from '/components/users/reputation/ReputationList'
import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'

import { DocumentCheckIcon, TagIcon } from '@heroicons/react/24/outline'

import PageTabBar from '/components/generic/pagetabbar/PageTabBar'
import PageTab from '/components/generic/pagetabbar/PageTab'
import Spinner from '/components/Spinner'

import './UserProfilePage.css'

const UserProfilePage = function(props) {
    const { id, tab } = useParams()

    const navigate = useNavigate()
    const selectTab = function(tabName) {
        const urlString = `/user/${id}/${tabName}`
        navigate(urlString)
    }

    const selectedTab = ( tab ? tab : 'papers')
    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'papers' ) {
        content = (
            <PublishedPaperList authorId={ id }  />
        )
    } else if ( selectedTab == 'reputation' ) {
        content = ( 
            <ReputationList id="reputation" userId={id} />
        )
    }


    return (
        <>
            <PageTabBar>
                <PageTab url={`/user/${id}/papers`} selected={selectedTab == 'papers'}>
                    <DocumentCheckIcon /> Papers
                </PageTab>
                <PageTab url={`/user/${id}/reputation`} selected={selectedTab == 'reputation'}>
                    <TagIcon /> Reputation
                </PageTab> 
            </PageTabBar>
            <div id="user-profile-page" className="page">
                <UserView id={id} />
                <div className="tab-content">
                    { content }
                </div>
            </div>
        </>
    )
}

export default UserProfilePage
