import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { postVotes, cleanupRequest } from '/state/papers'

import Spinner from '/components/Spinner'

import './PublishedPaperVoteWidget.css'

const PublishedPaperVoteWidget = function(props) {

    // ======= Render State =========================================

    const [ errorType, setErrorType ] = useState(null)

    // ======= Request Tracking =====================================

    const [ voteRequestId, setVoteRequestId] = useState(null)
    const voteRequest = useSelector(function(state) {
        if ( ! voteRequestId ) {
            return null
        } else {
            return state.papers.requests[voteRequestId]
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const vote = useSelector(function(state) {
        if (currentUser && state.papers.dictionary[props.paper.id].votes.length > 0) {
            return state.papers.dictionary[props.paper.id].votes.find((v) => v.userId == currentUser.id)
        }  else {
            return null
        }
    })

    
    const isAuthor = ( currentUser && props.paper.authors.find((a) => a.user.id == currentUser.id) ? true : false)

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    // TODO Don't let authors vote on their own papers.
    // TODO Allow users to undo their votes by clicking on the vote icon again.
    const voteUp = function(event) {
        event.preventDefault()

        if ( ! vote ) {
            const newVote = {
                paperId: props.paper.id,
                userId: currentUser.id,
                score: 1
            }
            setVoteRequestId(dispatch(postVotes(newVote)))
        }
    }

    const voteDown = function(event) {
        event.preventDefault()

        if ( ! vote ) {
            const newVote = {
                paperId: props.paper.id,
                userId: currentUser.id,
                score: -1
            }
            setVoteRequestId(dispatch(postVotes(newVote)))
        }
    }

    // ======= Effect Handling ======================================
    
    useEffect(function() {
        return function cleanup() {
            if ( voteRequestId ) {
                dispatch(cleanupRequest({ requestId: voteRequestId }))
            }
        }
    }, [ voteRequestId ])

    // ======= Render ===============================================

    let score = 0
    for(const v of props.paper.votes) {
        score += v.score
    }

    let error = null
    if ( voteRequest && voteRequest.state == 'failed') {
        error = ( <div className="request-failure">{ voteRequest.error }</div> )
    }

    return (
        <div className="published-paper-vote-widget">
            { error && <div class="error">{ error }</div> }
            { currentUser && ! isAuthor && <div className={ vote && vote.score == 1 ? 'vote-button vote-up highlight' : 'vote-button vote-up' } onClick={voteUp} ></div> }
            <div className="score">{score}</div>
            { currentUser && ! isAuthor && <div className={ vote && vote.score == -1 ? 'vote-button vote-down highlight' : 'vote-button vote-down' } onClick={voteDown} ></div> }
        </div>
    )
}

export default PublishedPaperVoteWidget
