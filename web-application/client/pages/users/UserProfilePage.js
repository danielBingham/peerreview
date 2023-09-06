import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import ReactMarkdown from 'react-markdown'
import { DocumentCheckIcon, TagIcon } from '@heroicons/react/24/outline'

import { getUser, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageTabBar, PageTab } from '/components/generic/Page'

import UserView from '/components/users/UserView'
import PaperList from '/components/papers/list/PaperList'

import './UserProfilePage.css'

const UserProfilePage = function(props) {
    const { id, pageTab} = useParams()

    // ======= Request Tracking =====================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
            return state.users.requests[requestId]
        }
    })

    // ======= Redux State ==========================================
    
    const user = useSelector(function(state) {
        return state.users.dictionary[id]
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ================= User Action Handling  ================================
    
    const dispatch = useDispatch()
    const navigate = useNavigate()

    // ======= Effect Handling ======================================

    useEffect(function() {
        setRequestId(dispatch(getUser(id)))
    }, [ ])


    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    // ======= Render ===============================================

    const selectedTab = ( pageTab ? pageTab : 'papers')

    let content = ( <Spinner local={true} /> )
    if ( request && request.state == 'fulfilled' ) {
        if ( selectedTab == 'papers' ) {
            content = (
                <PaperList type="published" authors={[ id ]}  />
            )
        } else if ( selectedTab == 'biography' ) {
            content = (
                <div className="user-bio">
                    { user.bio && <div className="bio"><ReactMarkdown children={ user.bio } /> </div>}
                </div>
            )
        }
    }

    return (
        <Page id="user-profile-page">
            <PageHeader>
                <UserView id={id} />
            </PageHeader>
            <PageTabBar>
                <PageTab url={`/user/${id}/papers`} tab="papers" initial={true}>
                    <DocumentCheckIcon /> Papers
                </PageTab>
                <PageTab url={`/user/${id}/biography`} tab="biography">
                    Biography
                </PageTab>
            </PageTabBar>
            <PageBody>
                <div className="tab-content">
                    { content }
                </div>
            </PageBody>
        </Page>
    )
}

export default UserProfilePage
