import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

import { getPaper, cleanupRequest } from '/state/papers'

import UserTag from '/components/users/UserTag'
import Field from '/components/fields/Field'
import Spinner from '/components/Spinner'

import DraftPaperControlView from './DraftPaperControlView'
import DraftPaperReviewsWrapperView from './review/DraftPaperReviewsWrapperView'

import './DraftPaperView.css'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to
 * handle that.
 *
 * @param {int} id  - The id of the draft paper we want to load.  Assumes the
 * paper is a draft.
 */
const DraftPaperView = function(props) {
    const [ requestId, setRequestId] = useState(null)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    // ================= Request Tracking =====================================
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
           return state.papers.requests[requestId]
        }
    })

    // ================= Redux State ==========================================

    const paper = useSelector(function(state) {
        return state.papers.dictionary[props.id]
    })

    // ======= Effect Handling =====================

    useEffect(function() {
        if ( paper && ! paper.isDraft ) {
            const url = `/paper/${paper.id}`
            navigate(url)
        }
    }, [ paper ])


    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        setRequestId(dispatch(getPaper(props.id)))
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
    
    if (request && request.state == 'fulfilled' && paper.isDraft) {
        // Error checking.
        if ( ! paper ) {
            throw new Error(`Attempt to view draft paper ${props.id} but paper doesn't exist after request.`)
        } 

        let authors = [] 
        for(const author of paper.authors) {
            authors.push(<UserTag key={author.user.id} id={author.user.id} />)
        }

        let fields = []
        for(const field of paper.fields) {
            fields.push(<Field key={field.id} field={field} />)
        }

        const id = `paper-${paper.id}`
        return (
            <div id={id} className="draft-paper">
                <h2 className="title">{paper.title}</h2>
                <div className="submitted date">{paper.createdDate}</div>
                <div className="authors">{authors}</div>
                <div className="fields">{fields}</div>
                <DraftPaperControlView paper={paper} versionNumber={props.versionNumber} />
                <DraftPaperReviewsWrapperView paper={paper} versionNumber={props.versionNumber} />
            </div>
        )
     } else {
         return (
             <Spinner />
         )
     }

}

export default DraftPaperView 
