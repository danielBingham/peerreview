import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getPaper, cleanupRequest as cleanupPaperRequest } from '/state/papers'

import Field from '/components/fields/Field'
import Spinner from '/components/Spinner'

import DraftPaperControlView from './DraftPaperControlView'
import DraftPaperReviewsWrapperView from './review/DraftPaperReviewsWrapperView'

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


    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        if ( ! requestId ) {
            setRequestId(dispatch(getPaper(props.id)))
        } 

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupPaperRequest(request))
            }
        }

    }, [])


    // ================= Render ===============================================
    
    if (request && request.state == 'fulfilled') {
        // Error checking.
        if ( ! paper ) {
            throw new Error(`Attempt to view draft paper ${props.id} but paper doesn't exist after request.`)
        } else if ( ! paper.isDraft) {
            throw new Error(`Attempt to view published paper, ${paper.id}, as a draft.`)
        }

        let authorString = ''
        for(const author of paper.authors) {
            authorString += author.user.name + ( author.order < paper.authors.length ? ', ' : '')
        }

        let fields = []
        for(const field of paper.fields) {
            fields.push(<Field key={field.id} field={field} />)
        }

        const id = `paper-${paper.id}`
        return (
            <div id={id} className="draft-paper">
                <h2 className="title">{paper.title}</h2>
                <div className="authors">{authorString}</div>
                <div className="fields">{fields}</div>
                <DraftPaperControlView paper={paper} />
                <DraftPaperReviewsWrapperView paper={paper} />
            </div>
        )
     } else {
         return (
             <Spinner />
         )
     }

}

export default DraftPaperView 
