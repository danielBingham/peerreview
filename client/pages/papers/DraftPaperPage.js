import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { useParams, useSearchParams } from 'react-router-dom'

import { getPaper, cleanupRequest } from '/state/papers'

import DraftPaperView from '/components/papers/draft/view/DraftPaperView'

import Spinner from '/components/Spinner'
import Error404 from '/components/Error404'

const DraftPaperPage = function(props) {

    const { id } = useParams()
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

    // ======= Effect Handling =====================
   
    const navigate = useNavigate()
    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! currentUser ) {
            navigate("/")
        }
    }, [ currentUser ])

    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        setRequestId(dispatch(getPaper(id)))
    }, [])


    useEffect(function() {
        if ( paper && ! paper.isDraft ) {
            const url = `/paper/${paper.id}`
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

    

    if ( currentUser && paper ) {
        const versionNumber = searchParams.get('version')
        const mostRecentVersion = paper.versions[0].version

        return (
            <div id="draft-paper-page" className="page">
                <DraftPaperView id={id} versionNumber={( versionNumber ? versionNumber : mostRecentVersion )} />
            </div>
        )
    } else if (request && request.state == 'failed' ) {
        return (
            <div id="draft-paper-page" className="page">
                <Error404 />
            </div>
        )
    } else {
        return (
            <Spinner />
        )
    }
}

export default DraftPaperPage
