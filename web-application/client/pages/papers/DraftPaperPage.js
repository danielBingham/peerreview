import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { getPaper, cleanupRequest } from '/state/papers'

import DraftPaperView from '/components/papers/draft/view/DraftPaperView'
import DraftPaperReviewsView from '/components/papers/draft/view/DraftPaperReviewsView'

import DraftPaperHeader from '/components/papers/draft/view/header/DraftPaperHeader'
import ReviewList from '/components/reviews/list/ReviewList'

import { ChatBubbleLeftRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

import PageTabBar from '/components/generic/pagetabbar/PageTabBar'
import PageTab from '/components/generic/pagetabbar/PageTab'
import PageHeader from '/components/generic/PageHeader'
import Spinner from '/components/Spinner'
import Error404 from '/components/Error404'

const DraftPaperPage = function(props) {

    const { id, versionNumber } = useParams()
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ================= Request Tracking =====================================
    
    const [ requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
           return state.papers.requests[requestId]
        }
    })

    // ================= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[id]
    })
    const mostRecentVersion = paper?.versions[0].version

    // ======= Actions ====================================


    // ======= Effect Handling =====================
   
    const dispatch = useDispatch()
    const navigate = useNavigate()

    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        setRequestId(dispatch(getPaper(id)))
    }, [])


    useEffect(function() {
        if ( paper && ! paper.isDraft ) {
            let url = `/paper/${paper.id}`
            if ( versionNumber ) {
                url += `/version/${versionNumber}`
                if ( props.tab ) {
                    url += `/${props.tab}`
                }
            }
            navigate(url)
        }
    }, [ paper ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    if ( ! request || request.state !== 'fulfilled' ) {
        return (
            <Spinner />
        )
    }

    const version = versionNumber || mostRecentVersion
    const selectedTab = ( props.tab ? props.tab : 'reviews')
    let content = ( <Spinner local={true} /> )
    if ( request && request.state == 'fulfilled') {
        if ( selectedTab == 'reviews' ) {
            content = (
                <DraftPaperReviewsView paperId={id} tab={selectedTab} versionNumber={( versionNumber ? versionNumber : mostRecentVersion )} />
            )
        } else if ( selectedTab == 'drafts' ) {
            content = ( 
                <DraftPaperView id={id} tab={selectedTab} versionNumber={( versionNumber ? versionNumber : mostRecentVersion )} />
            )
        }

    } else if (request && request.state == 'failed' ) {
        // TODO TECHDEBT Better error handling here.
        console.error(request.error)
        return (
            <Error404 />
        )
    } 
    
    return (
        <>
            <PageHeader>
                <DraftPaperHeader id={id} tab={selectedTab} versionNumber={versionNumber} />
            </PageHeader>
            <PageTabBar>
                <PageTab url={`/draft/${id}/version/${version}/reviews`} selected={selectedTab == 'reviews'}>
                    <ChatBubbleLeftRightIcon /> Conversation 
                </PageTab>
                <PageTab url={`/draft/${id}/version/${version}/drafts`} selected={selectedTab == 'drafts'}>
                    <DocumentTextIcon /> Files 
                </PageTab>
            </PageTabBar>
            <div id="draft-paper-page" className="page">
                { content }
            </div>
        </>
    )
}

export default DraftPaperPage
