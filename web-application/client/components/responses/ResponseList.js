import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getResponses, cleanupRequest } from '/state/responses'

import ResponseForm from './ResponseForm'
import ResponseView from './ResponseView'

import { 
    List, 
    ListHeader, 
    ListTitle, 
    ListControls, 
    ListControl, 
    ListRowContent, 
    ListNoContent 
} from '/components/generic/list/List'

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

    // ======= Redux State ==========================================
   
    const responses = useSelector(function(state) {
        return state.responses.list[props.paper.id]
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
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

    // ======= Actions and Event Handling ===========================
    
    // ======= Effect Handling ======================================
    
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

    // ======= Render ===============================================
    
    let content = ( <Spinner /> )
    let noContent = null
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
            content = null 
            noContent = (<span>No one has written a response yet.</span>)
        } else {
            content = responseViews
        }
    } else if ( request && request.state == 'failed' ) {
        content = null
        noContent = ( <div className="error">Request failed: { request.error }</div>)
    }

    let canRespond = false
    if ( currentUser ) {
       canRespond = true 
    }

    let isAuthor = props.paper.authors.find((a) => a.userId == currentUser?.id)

    return (
        <div className="responses">
            <List className="response-list">
                <ListHeader>
                    <ListTitle>Responses</ListTitle>
                </ListHeader>
                <ListNoContent>
                    {noContent}
                </ListNoContent>
                <ListRowContent>
                    { content }
                </ListRowContent>
            </List>
            { (currentUser && ! isAuthor && canRespond && ! userResponse) && <ResponseForm paper={props.paper} currentUser={currentUser} /> }
        </div>
    )

}

export default ResponseList
