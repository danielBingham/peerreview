import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate} from 'react-router-dom'

import { getPaper, cleanupRequest } from '/state/papers'

import PublishedPaperView from '/components/papers/published/view/PublishedPaperView'
import DraftPaperView from '/components/papers/draft/view/DraftPaperView'
import DraftPaperReviewsView from '/components/papers/draft/view/DraftPaperReviewsView'

import Spinner from '/components/Spinner'

const PublishedPaperPage = function(props) {

    // ======= Routing Parameters ===================================
    
    const { id, versionNumber } = useParams() 

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

    // ================= User Action Handling  ================================
    
    const dispatch = useDispatch()
    const navigate = useNavigate()
    
    const selectTab = function(tabName) {
        if ( tabName == 'paper' ) {
            const url = `/paper/${id}`
            navigate(url)
        } else if ( tabName == 'reviews' ) {
            const url = `/paper/${id}/version/${ ( versionNumber ? versionNumber : mostRecentVersion ) }/reviews`
            navigate(url)
        } else if ( tabName == 'drafts' ) {
            const url = `/paper/${id}/version/${ ( versionNumber ? versionNumber : mostRecentVersion )}/drafts`
            navigate(url)
        }
    }

    // ======= Effect Handling =====================
    
    
    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        setRequestId(dispatch(getPaper(id)))
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
    
    const selectedTab = ( props.tab ? props.tab : 'paper')

    let content = (<Spinner local={true} />)
    if ( request && request.state == 'fulfilled' ) {
        if ( selectedTab == 'paper' ) {
            content = ( <PublishedPaperView  id={id} /> )
        } else if ( selectedTab == 'reviews' ) {
            content = (
                <DraftPaperReviewsView paperId={id} tab={selectedTab} versionNumber={( versionNumber ? versionNumber : mostRecentVersion )} />
            )
        } else if ( selectedTab == 'drafts' ) {
            content = (
                <DraftPaperView id={id} tab={selectedTab} versionNumber={( versionNumber ? versionNumber : mostRecentVersion )} />
            )
        } else {
            throw new Error(`Invalid tab "${selectedTab}".`)
        }
    } else if ( request && request.state == 'failed' ) {
        // TODO TECHDEBT Better error handling here.
        console.error(request.error)
        return (
            <Error404 />
        )
    }

    return (
        <>
            <div className="page-tab-bar">
                <div onClick={(e) => selectTab('paper')} className={`page-tab ${ ( selectedTab == 'paper' ? 'selected' : '' )}`}>Paper</div>
                <div onClick={(e) => selectTab('reviews')} className={`page-tab ${ ( selectedTab == 'reviews' ? 'selected' : '')}`}>Reviews</div>
                <div onClick={(e) => selectTab('drafts')} className={`page-tab ${ ( selectedTab == 'drafts' ? 'selected' : '' ) }`}>Drafts</div>
            </div>
            <div id="published-paper-page" className="page">
                {content}
            </div>
        </>
    )
}

export default PublishedPaperPage
