import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getResponses, cleanupRequest } from '/state/responses'

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

    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getResponses(props.paper.id, true)))
    }, [])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

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
    if ( currentUser && fields.length > 0) {
        for (const field of fields ) {
            if ( currentUser.fields[field.id] && currentUser.fields[field.id].reputation >= reputationThresholds.respond * field.average_reputation  ) {
               canRespond = true 
            }
        }
    }

    return (
        <div className="paper-response-list">
            <div className="header">
                <h2>Responses</h2>
                <div className="controls">
                    <div className="control">Newest</div>
                    <div className="control">Oldest</div>
                    <div className="control">Highest Scoring</div>
                </div>
            </div>
            { content }
            { (currentUser && canRespond && ! userResponse) && <ResponseForm paper={props.paper} currentUser={currentUser} /> }
        </div>
    )

}

export default ResponseList
