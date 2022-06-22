import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

import {  patchPaper, cleanupRequest as cleanupPaperRequest } from '/state/papers'
import {  patchReview, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

const DraftPaperControlView = function(props) {
    const [ patchPaperRequestId, setPatchPaperRequestId ] = useState(null)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    // ================= Request Tracking =====================================
    
    const patchPaperRequest = useSelector(function(state) {
        if ( ! patchPaperRequestId ) {
            return null
        } else {
            return state.papers.requests[patchPaperRequestId]
        }
    })
   
    // ================= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const isAuthor = (currentUser && props.paper.authors.find((a) => a.user.id == currentUser.id) ? true : false)
    const isOwner = (currentUser && isAuthor && props.paper.authors.find((a) => a.user.id == currentUser.id).owner ? true : false)

    // ================= User Action Handling  ================================

    const publishPaper = function(event) {
        event.preventDefault()

        const paperPatch = {
            id: props.paper.id,
            isDraft: false
        }
        setPatchPaperRequestId(dispatch(patchPaper(paperPatch)))
    }

    useEffect(function() {

        if ( patchPaperRequestId && patchPaperRequest && patchPaperRequest.state == 'fulfilled' ) {
            const paperPath = '/paper/' + paper.id
            navigate(paperPath)
        }

        return function cleanup() {
            if ( patchPaperRequest ) {
                dispatch(cleanupPaperRequest(patchPaperRequestId))
            }
        }

    })

    let contents = ''
     if ( isAuthor ) {
        contents = (
            <button onClick={publishPaper}>Publish</button>
        )
    }

    return (
        <div className="draft-paper-controls">
            { contents }
        </div>
    )

}

export default DraftPaperControlView
