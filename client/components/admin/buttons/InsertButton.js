import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { postFeatures, cleanupRequest } from '/state/features'

import Spinner from '/components/Spinner'

const InsertButton = function(props) {

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.features.requests[requestId]
        } else {
            return null
        }
    })

    const feature = useSelector(function(state) {
        return state.features.dictionary[props.name]
    })

    const dispatch = useDispatch()

    const initialize = function(event) {
        event.preventDefault()

        setRequestId(dispatch(postFeatures({ name: feature.name })))
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    if ( request && request.state == 'in-progress' ) {
        return ( <Spinner local={true} /> )
    }

    if ( feature.status == 'uncreated' ) {
        return ( <button className="insert" onClick={initialize}>Insert</button> )
    }

    return (
        <button disabled={true} className="insert">Insert</button>
    )

}

export default InsertButton
