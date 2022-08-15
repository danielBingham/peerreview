import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { clearList, getPapers, cleanupRequest } from '/state/papers'
import { countResponses, cleanupRequest as cleanupResponseRequest } from '/state/responses'

import Spinner from '/components/Spinner'

import PublishedPaperListItem from './PublishedPaperListItem'

import './PublishedPaperList.css'


/**
 * A list displaying the papers that have been posted. 
 *
 * @param {object} props - An empty object, takes no props.
 */
const PublishedPaperList = function(props) { 

    // ======= Request Tracking =====================================

    const [requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if (requestId) {
            return state.papers.requests[requestId]
        } else {
            null
        }
    })

    const [responseRequestId, setResponseRequestId ] = useState(null)
    const responseRequest = useSelector(function(state) {
        if (responseRequestId) {
            return state.papers.requests[responseRequestId]
        } else {
            null
        }
    })


    // ======= Redux State ==========================================
   
    const paperList = useSelector(function(state) {
        return state.papers.list
    })

    // ======= Effect Handling ======================================

    const dispatch = useDispatch()

    const queryForPapers = function() {
        let query = {}
        if ( props.query ) {
            query = {
                ...props.query
            }
        }
        query.isDraft = false

        setRequestId(dispatch(getPapers(query, true)))
        setResponseRequestId(dispatch(countResponses()))
    }

    useLayoutEffect(function() {
        queryForPapers()
    }, [ props.query ])

    useEffect(function() {
        if ( requestId && ! request ) {
            queryForPapers()
        }
    }, [ request ])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({requestId: requestId}))
            }
        }
    }, [ requestId ])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( responseRequestId ) {
                dispatch(cleanupResponseRequest({requestId: responseRequestId}))
            }
        }
    }, [ responseRequestId ])

    // ======= Render ===============================================
    
    let content = (<Spinner local={true} /> ) 
    if ( request && request.state == 'fulfilled') { 
        content = []
        for (const paper of paperList) {
            content.push(<PublishedPaperListItem paper={paper} key={paper.id} />)
        }

        if ( content.length == 0 ) {
            content = ( <div className="empty-search">No published papers to display.</div>)
        }
    }

    let error = null
    if ( request && request.state == 'failed' ) {
        error = (<div className="error">Something went wrong with our attempt to retreive the paper list: { request.error }.</div>)
    }

    return (
        <section className="published-paper-list">
            <div className="header">
                <h2>Published Papers</h2>
                <div className="controls">
                    <div className="sort">
                        <div>Newest</div>
                        <div>Active</div>
                    </div>
                </div>
            </div>
            <div>
                {error}
                {content}
            </div>
        </section>
    )
}

export default PublishedPaperList 
