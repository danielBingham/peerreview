import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import ReactMarkdown from 'react-markdown'
import { DocumentCheckIcon, TagIcon } from '@heroicons/react/24/outline'

import { getUser, cleanupRequest } from '/state/users'

import UserView from '/components/users/UserView'
import PaperList from '/components/papers/list/PaperList'

import PageHeader from '/components/generic/PageHeader'
import PageTabBar from '/components/generic/pagetabbar/PageTabBar'
import PageTab from '/components/generic/pagetabbar/PageTab'
import Spinner from '/components/Spinner'

import './UserProfilePage.css'

const UserProfilePage = function(props) {
    const { id, tab } = useParams()

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

    const selectTab = function(tabName) {
        const urlString = `/user/${id}/${tabName}`
        navigate(urlString)
    }

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

    const selectedTab = ( tab ? tab : 'papers')

    let content = ( <Spinner local={true} /> )
    if ( request && request.state == 'fulfilled' ) {
        if ( selectedTab == 'papers' ) {
            content = (
                <PaperList type="published" authorId={ id }  />
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
        <>
            <PageHeader>
                <UserView id={id} />
            </PageHeader>
            <PageTabBar>
                <PageTab url={`/user/${id}/papers`} selected={selectedTab == 'papers'}>
                    <DocumentCheckIcon /> Papers
                </PageTab>
                <PageTab url={`/user/${id}/biography`} selected={selectedTab == 'biography'}>
                    Biography
                </PageTab>
            </PageTabBar>
            <div id="user-profile-page" className="page">
                <div className="tab-content">
                    { content }
                </div>
            </div>
        </>
    )
}

export default UserProfilePage
