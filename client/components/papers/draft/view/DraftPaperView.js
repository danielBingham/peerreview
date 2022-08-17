import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

import { getPaper, cleanupRequest } from '/state/papers'

import UserTag from '/components/users/UserTag'
import Field from '/components/fields/Field'
import DateTag from '/components/DateTag'
import Spinner from '/components/Spinner'
import Error404 from '/components/Error404'

import DraftPaperControlView from './DraftPaperControlView'
import DraftPaperReviewsWrapperView from './review/DraftPaperReviewsWrapperView'

import './DraftPaperView.css'

/**
 * Show a draft paper and its reviews, or show the reviews from the draft stage
 * of a published paper.
 *
 * Assumptions:
 *  - Assumes we have a current user logged in.  
 * 
 * @param {Object} props    Standard react props object.
 * @param {int} props.id    The id of the draft paper we want to load and show
 * reviews for. 
 */
const DraftPaperView = function({ id, versionNumber }) {
    
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

    const paper = useSelector(function(state) {
        return state.papers.dictionary[id]
    })

    // ======= Effect Handling =====================
   
    const dispatch = useDispatch()

    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        if ( ! paper ) {
            setRequestId(dispatch(getPaper(id)))
        }
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
    
    // Error checking.
    if ( ! paper && request && request.state == 'fulfilled' ) {
        return ( <Error404 /> ) 
    } 

    if ( (! paper && ! request) || (request && request.state == 'pending')) {
        return (<div id={`paper-${id}`} className="draft-paper"><Spinner /></div>)
    }

    if ( request && request.state == 'failed' ) {
        return ( <div id={`paper-${id}`} className="draft-paper">
            <div className="error">
                Something went wrong with the attempt to retrieve the paper. <br />
                Error Type: {request.error}
            </div>
        </div>
        )
    }

    const mostRecentVersion = paper.versions[0].version

    let authors = [] 
    for(const author of paper.authors) {
        authors.push(<UserTag key={author.user.id} id={author.user.id} />)
    }

    let fields = []
    for(const field of paper.fields) {
        fields.push(<Field key={field.id} field={field} />)
    }

    return (
        <div id={`paper-${id}`} className="draft-paper">
            <h2 className="title">{paper.title}</h2>
            <div className="submitted date">submitted <DateTag timestamp={paper.createdDate} /></div>
            <div className="authors">by {authors}</div>
            <div className="fields">{fields}</div>
            <DraftPaperControlView id={id} versionNumber={( versionNumber ? versionNumber : mostRecentVersion )} />
            <DraftPaperReviewsWrapperView paper={paper} versionNumber={( versionNumber ? versionNumber : mostRecentVersion )} />
        </div>
    )

}

export default DraftPaperView 
