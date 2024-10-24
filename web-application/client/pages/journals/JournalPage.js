import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import { getJournal, cleanupRequest } from '/state/journals'

import { DocumentArrowUpIcon, InboxArrowDownIcon, DocumentTextIcon, UserGroupIcon, InformationCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageHeaderGrid, PageHeaderControls, PageTabBar, PageTab } from '/components/generic/Page'
import Button from '/components/generic/button/Button'

import JournalView from '/components/journals/JournalView'
import JournalMembersList from '/components/journals/members/JournalMembersList'
import JournalSubmissionsList from '/components/journals/submissions/JournalSubmissionsList'

import PaperList from '/components/papers/list/PaperList'


const JournalPage = function(props) {

    // ======= Routing Parameters ===================================
    
    const { id, pageTab } = useParams()
    
    // ================= Request Tracking =====================================
    
    const [ requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
           return state.journals.requests[requestId]
        }
    })

    // ================= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const journal = useSelector(function(state) {
        return state.journals.dictionary[id]
    })

    let currentUserMember = null
    if ( currentUser ) {
        currentUserMember = journal?.members.find((m) => m.userId == currentUser.id)
    }

    // ================= Actions ==============================================

    const navigate = useNavigate()
    const selectTab = function(tabName) {
        const urlString = `/user/${id}/${tabName}`
        navigate(urlString)
    }


    // ======= Effect Handling =====================
    
    const dispatch = useDispatch()
    
    /**
     * If we haven't retrieved the journal we're viewing yet, go ahead and
     * retrieve it from the journal endpoint to get full and up to date data.
     */
    useEffect(function() {
        setRequestId(dispatch(getJournal(id)))
    }, [])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    // ================= Render ===============================================
   
    const selectedTab = ( pageTab ? pageTab : 'papers')

    let content = ( <Spinner /> )
    if (  request && request.state == 'fulfilled') {
        if ( selectedTab == 'papers' ) {
            content = ( <PaperList type="published" journals={[id]} /> ) 
        } else if ( selectedTab == 'submissions' ) {
            content = ( 
                <>
                    <JournalSubmissionsList id={id} />
                </>
            )
        } else if ( selectedTab == 'members' ) {
            content = ( 
                <>
                    <JournalMembersList id={id} /> 
                </>
            )
        } else if ( selectedTab == 'about' ) {
            content = ( <div className="about">{ journal.description }</div> ) 
        } else if ( selectedTab == 'settings' ) {
            content = ( <div className="settings">
                <h2>Under construction</h2>
                <p> Currently proposed settings. </p>
                <h3> Review Style</h3>
                <p><strong>Open</strong>: Authors, Editors, and Reviewers can see everything during review.  All review events are public after publication.  Anonymity always respected.</p>
                <p><strong>Closed Pre-publication</strong>: Only Editors can see all review events on a journal submission.  Editors may choose which events to share with authors or reviewers.  All events are public after publication.  Anonymity always respected.</p>
                <p><strong>Closed</strong>: Only Editors can see all review events on a journal submission. Editors may choose which events to share with authors or other reviewers. No events are public after publication. Anonymity always respected.</p>
                <h3>Anonymity</h3>
                <p><strong>Open Required</strong>: Authors, editors and reviewers are always identified.</p>
                <p><strong>Open Default</strong>: Authors, editors, and reviewers may choose anonymity, but default to identified.</p>
                <p><strong>Authors Anonymous</strong>: Authors are always anonymous, editors and reviewers may choose anonymity but default to identified.</p>
                <p><strong>Double Anonymous</strong>: Everyone is always anonymous.</p>
            </div>
            )
        }

    } 

    return (
        <Page id="journal-page">
            <PageHeader>
                <PageHeaderGrid>
                    <div></div>
                    <PageHeaderControls>
                        <Button type="primary" onClick={(e) => navigate(`/submit?journal=${journal.id}`)}><DocumentArrowUpIcon/>New Submission</Button>
                    </PageHeaderControls>
                    <JournalView id={id} />
                    <div></div>
                </PageHeaderGrid>
            </PageHeader>
            <PageTabBar>
                <PageTab url={`/journal/${id}/papers`} tab="papers" initial={true}>
                    <DocumentTextIcon /> Published Papers 
                </PageTab>
                <PageTab url={`/journal/${id}/about`} tab="about">
                    <InformationCircleIcon /> About
                </PageTab>
                <PageTab url={`/journal/${id}/members`} tab="members">
                    <UserGroupIcon /> Members
                </PageTab>
                { currentUserMember && <>
                    <PageTab url={`/journal/${id}/submissions`} tab="submissions">
                        <InboxArrowDownIcon /> Submissions 
                    </PageTab>  
                    <PageTab url={`/journal/${id}/settings`} tab="settings">
                        <Cog6ToothIcon /> Settings
                    </PageTab> 
                </>}
            </PageTabBar>
            <PageBody>
                { content } 
            </PageBody>
        </Page>
    )

}

export default JournalPage
