import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getResponses, cleanupRequest } from '/state/responses'
import { getReputations, cleanupRequest as cleanupReputationRequest } from '/state/reputation'

import ResponseForm from './ResponseForm'
import ResponseView from './ResponseView'

import Spinner from '/components/Spinner'

import './ResponseList.css'

const ResponseList = function(props) {
    
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.responses.requests[requestId]
        } else {
            return null
        }
    })

    const [ reputationRequestId, setReputationRequestId] = useState(null)
    const reputationRequest = useSelector(function(state) {
        if ( ! reputationRequestId ) {
            return null
        } else {
            return state.papers.requests[reputationRequestId]
        }
    })

    // ======= Redux State ==========================================
   
    const responses = useSelector(function(state) {
        return state.responses.list[props.paper.id]
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const reputationThresholds = useSelector(function(state) {
        return state.reputation.thresholds
    })

    const fields = useSelector(function(state) {
        const fields = []
        if ( props.paper.fields.length > 0 ) {
            for (const field of props.paper.fields) {
                fields.push(state.fields.dictionary[field.id])
            }
        }
        return fields
    })

    const reputations = useSelector(function(state) {
        if ( currentUser) {
            return state.reputation.dictionary[currentUser.id]    
        } else {
            return null 
        }
    })

    // ======= Actions and Event Handling ===========================
    
    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getResponses(props.paper.id, true)))
    }, [])

    useEffect(function() {
        if ( currentUser ) {
            setReputationRequestId(dispatch(getReputations(currentUser.id, { paperId: props.paper.id })))
        }
    }, [ currentUser ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    useEffect(function() {
        return function cleanup() {
            if ( reputationRequestId ) {
                dispatch(cleanupReputationRequest({ requestId: reputationRequestId }))
            }
        }
    }, [ reputationRequestId ])

    // ======= Render ===============================================
    
    let content = ( <Spinner /> )
    let userResponse = null
    if ( request && request.state == 'fulfilled') {
        let responseViews = []
        for(const response of responses) {
            if ( currentUser && response.userId == currentUser.id ) {
                userResponse = response
            }
            responseViews.push(<ResponseView key={response.id} paper={props.paper} response={response} />)
        }

        if ( responseViews.length == 0 ) {
            content = ( <div className="no-content">No one has written a response yet.</div> )
        } else {
            content = responseViews
        }
    } else if ( request && request.state == 'failed' ) {
        content = ( <div className="error">Request failed: { request.error }</div>)
    }

    let canRespond = false
    if ( currentUser && reputations && fields.length > 0) {
        for (const field of fields ) {
            const threshold = reputationThresholds.referee * field.averageReputation
            if ( reputations[field.id] && reputations[field.id].reputation >= threshold) {
               canRespond = true 
            }
        }
    }

    let isAuthor = props.paper.authors.find((a) => a.user.id == currentUser?.id)

    return (
        <div className="paper-response-list">
            <div className="header">
                <h2>Responses</h2>
            </div>
            { content }
            { (currentUser && ! isAuthor && canRespond && ! userResponse) && <ResponseForm paper={props.paper} currentUser={currentUser} /> }
        </div>
    )

}

export default ResponseList
