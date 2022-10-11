import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchFeature, cleanupRequest } from '/state/features'

import Spinner from '/components/Spinner'

const MigrateButton = function(props) {

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

    const migrate = function(event) {
        event.preventDefault()

        setRequestId(dispatch(patchFeature({ name: feature.name, status: 'migrated' })))
    }

    const rollback = function(event) {
        event.preventDefault()

        setRequestId(dispatch(patchFeature({ name: feature.name, status: 'rolled-back' })))
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

    if ( feature.status == 'initialized' || feature.status == 'rolled-back') {
        return ( <button className="migrate" onClick={migrate}>Migrate</button> )
    }

    else if ( feature.status == 'migrated' || feature.status == 'disabled' ) {
        return ( <button className="rollback" onClick={rollback}>Rollback</button> )
    }

    return (
        <button disabled={true} className="migrate">Migrate</button>
    )

}

export default MigrateButton
