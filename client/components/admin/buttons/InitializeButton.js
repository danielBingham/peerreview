import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchFeature, cleanupRequest } from '/state/features'

import Spinner from '/components/Spinner'

const InitializeButton = function(props) {

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

        setRequestId(dispatch(patchFeature({ name: feature.name, status: 'initialized' })))
    }

    const uninitialize = function(event) {
        event.preventDefault()

        setRequestId(dispatch(patchFeature({ name: feature.name, status: 'uninitialized' })))
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

    if ( feature.status == 'uninitialized' || feature.status == 'created' ) {
        return ( <button className="initialize" onClick={initialize}>Initialize</button> )
    }

    else if ( feature.status == 'initialized' || feature.status == 'rolled-back') {
        return ( <button className="uninitialize" onClick={uninitialize}>Uninitialize</button> )
    }

    return (
        <button disabled={true} className="initialize">Initialize</button>
    )

}

export default InitializeButton
