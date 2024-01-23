import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'

import { DocumentCheckIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'

import { getPaper, loadFiles, clearFiles, cleanupRequest } from '/state/papers'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageHeaderGrid, PageTabBar, PageTab } from '/components/generic/Page'

import Error404 from '/components/Error404'
import PaperHeader from '/components/papers/view/header/PaperHeader'
import PaperControlView from '/components/papers/view/header/PaperControlView'

import PDFViewer from '/components/pdf/PDFViewer'
import PaperFileView from '/components/papers/view/file/PaperFileView'
import ResponseList from '/components/responses/ResponseList'
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

    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        setRequestId(dispatch(getPaper(id)))
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

    // ================= Render ===============================================

    if ( ! paper || ! request || request.state !== 'fulfilled' ) {
        return (
            <Spinner />
        )
    }

    const selectedTab = ( pageTab ? pageTab : (paper.isDraft ? 'file' :  'paper'))
    
    let content = ( <Spinner local={true} /> )
    if ( request && request.state == 'fulfilled') {

        // Published paper tab.  Only selectable if the paper is published.
        if ( ! paper.isDraft && selectedTab == 'paper' ) {
            const url = new URL(paper.versions[0].file.filepath, paper.versions[0].file.location)
            content = ( 
                <article id={paper.id} className="published-paper">
                    <section className="main">
                        <section className="published-paper-pdf-view">
                            <PDFViewer url={url.href} />        
                        </section>
                    </section>
                </article>
            )
        } 

        // Responses tab.  Only selectable if the paper is published.
        else if ( ! paper.isDraft && selectedTab == 'responses' ) {
            content = (
                <ResponseList paper={paper} />
            )
        }

        // Drafts tab, visible for drafts and published papers.
        else if ( selectedTab == 'file' ) {
            content = ( 
                <PaperFileView id={id} tab={selectedTab} />
            )
        }

        // Reviews tab.  Visible for drafts and published papers.
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

                { ! paper.isDraft && <PageTab url={`/paper/${id}`} tab="paper" initial={ ! paper.isDraft }>
                    <DocumentCheckIcon /> Paper
                </PageTab> }

                <PageTab url={`/paper/${id}/file`} tab="file" initial={ paper.isDraft }>
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
