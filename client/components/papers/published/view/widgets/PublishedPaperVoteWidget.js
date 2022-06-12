import React, { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { postVotes, cleanupRequest } from '/state/papers'

import Spinner from '/components/Spinner'

const PublishedPaperVoteWidget = function(props) {
    const [ voteRequestId, setVoteRequestId] = useState(null)
    const [ error, setError ] = useState(null)

    const dispatch = useDispatch()

    const voteRequest = useSelector(function(state) {
        if ( ! voteRequestId ) {
            return null
        } else {
            return state.papers.requests[voteRequestId]
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })


    let vote = null
    if ( currentUser && props.paper.votes.length > 0 ) {
        vote = props.paper.votes.find((v) => v.userId == currentUser.id)
    }

    const voteUp = function(event) {
        event.preventDefault()

        if ( ! vote ) {
            vote = {
                paperId: props.paper.id,
                userId: currentUser.id,
                score: 1
            }
            setVoteRequestId(dispatch(postVotes(vote)))
        }
    }

    const voteDown = function(event) {
        event.preventDefault()

        if ( ! vote ) {
            vote = {
                paperId: props.paper.id,
                userId: currentUser.id,
                score: -1
            }
            setVoteRequestId(dispatch(postVotes(vote)))
        }
    }

    useEffect(function() {

        if ( voteRequest && voteRequest.state == 'failed' ) {
            vote = null
            setError('Something went wrong with your vote.  Please try again.')
        }

        return function cleanup() {
            if ( voteRequest ) {
                dispatch(cleanupRequest(voteRequestId))
            }
        }
    })

    let score = 0
    for(const v of props.paper.votes) {
        score += v.score
    }

    return (
        <div className="paper-votes">
            { error && <div class="error">{ error }</div> }
            <a href="" className={ vote && vote.score == 1 ? 'highlight' : '' } onClick={voteUp} >+</a>
            {score}
            <a href="" className={ vote && vote.score == -1 ? 'highlight' : '' } onClick={voteDown} >-</a>
        </div>
    )
}

export default PublishedPaperVoteWidget
