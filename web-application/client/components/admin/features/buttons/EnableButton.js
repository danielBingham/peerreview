import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchFeature, cleanupRequest } from '/state/features'

import Spinner from '/components/Spinner'

const EnableButton = function(props) {

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

    const enable = function(event) {
        event.preventDefault()

        setRequestId(dispatch(patchFeature({ name: feature.name, status: 'enabled' })))
    }

    const disable = function(event) {
        event.preventDefault()

        setRequestId(dispatch(patchFeature({ name: feature.name, status: 'disabled' })))
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

    if ( feature.status == 'migrated' || feature.status == 'disabled') {
        return ( <button className="enable" onClick={enable}>Enable</button> )
    }

    else if ( feature.status == 'enabled' ) {
        return ( <button className="disable" onClick={disable}>Disable</button> )
    }

    return (
        <button disabled={true} className="enable">Enable</button>
    )

}

export default EnableButton
