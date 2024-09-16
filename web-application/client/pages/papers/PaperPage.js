import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'

import { DocumentCheckIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'

import { getPaper, loadFiles, clearFiles, cleanupRequest } from '/state/papers'
import { getPaperVersions, cleanupRequest as cleanupVersionRequest } from '/state/paperVersions'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageHeaderGrid, PageTabBar, PageTab } from '/components/generic/Page'

import Error404 from '/components/Error404'
import PaperHeader from '/components/papers/view/header/PaperHeader'
import PaperControlView from '/components/papers/view/header/PaperControlView'

import PaperFileView from '/components/papers/view/file/PaperFileView'
import PaperTimeline from '/components/papers/view/timeline/PaperTimeline'

import './PaperPage.css'

const PaperPage = function({}) {

    const { id, pageTab } = useParams()

    // ================= Request Tracking =====================================
    
    const [ requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
           return state.papers.requests[requestId]
        }
    })

    const [ versionRequestId, setVersionRequestId ] = useState(null)
    const versionRequest = useSelector(function(state) {
        if ( ! versionRequestId ) {
            return null
        } else {
            return state.paperVersions.requests[versionRequestId]
        }
    })

    // ================= Redux State ==========================================

    const paper = useSelector(function(state) {
        return state.papers.dictionary[id]
    })

    // ======= Actions ====================================


    // ======= Effect Handling =====================
   
    const dispatch = useDispatch()

    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        setRequestId(dispatch(getPaper(id, 'PaperPage')))
        setVersionRequestId(dispatch(getPaperVersions(id)))
    }, [ id ])

    useEffect(function() {
        if ( paper ) {
            dispatch(loadFiles(paper))
        }

        return function cleanup() {
            if ( paper ) {
                dispatch(clearFiles(paper))
            }
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

    useEffect(function() {
        return function cleanup() {
            if ( versionRequestId ) {
                dispatch(cleanupVersionRequest({ requestId: versionRequestId }))
            }
        }
    }, [ versionRequestId ])

    // ================= Render ===============================================

    if ( ! paper || ! request || request.state !== 'fulfilled' ) {
        return (
            <Spinner />
        )
    }

    const selectedTab = 'file' 
    
    let content = ( <Spinner local={true} /> )
    if ( request && request.state == 'fulfilled' && versionRequest && versionRequest.state == 'fulfilled') {

        if ( selectedTab == 'file' ) {
            content = ( 
                <PaperFileView id={id} tab={selectedTab} />
            )
        }

        else if ( selectedTab == 'timeline' ) {
            content = (
                <PaperTimeline paperId={id} />
            )
        } 

        else {
            throw new Error(`Invalid tab "${selectedTab}".`)
        }
    } 

    // ERROR HANDLING.
    else if (request && request.state == 'failed' ) {
        // TODO TECHDEBT Better error handling here.
        console.error(request.error)
        return (
            <Error404 />
        )
    } 

    
    return (
        <Page id="paper-page">
            <PageHeader>
                <PageHeaderGrid>
                    <div></div>
                    <PaperControlView paperId={id} />
                    <PaperHeader paperId={id} />
                    <div></div>
                </PageHeaderGrid>
            </PageHeader>
            <PageTabBar>

                <PageTab url={`/paper/${id}/file`} tab="file" initial={true}>
                    <DocumentTextIcon /> File
                </PageTab>

                <PageTab url={`/paper/${id}/timeline`} tab="timeline">
                    <ChatBubbleLeftRightIcon /> Timeline 
                </PageTab>

            </PageTabBar>
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )
}

export default PaperPage
