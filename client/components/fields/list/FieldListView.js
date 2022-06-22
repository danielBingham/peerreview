import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Field from '../Field'
import { getFields, cleanupRequest } from '/state/fields'

import Spinner from '/components/Spinner'

const FieldListView = function(props) {
    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.fields.requests[requestId]
        } else {
            return null
        }
    })

    const fields = useSelector(function(state) {
        return state.fields.dictionary
    })

    useEffect(function() {
        if ( ! requestId ) {
            setRequestId(dispatch(getFields()))
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }
    }, [ request ])

    if ( fields ) {
        const fieldViews = []
        for (const field of Object.values(fields)) {
            if ( ! field.parentId ) {
                fieldViews.push(<Field key={field.id} field={field} />)
            }
        }

        return (
            <div className="field-list">
                {fieldViews}
            </div>
        )
    } else if ( request && request.state == 'fulfilled') {
        return (
            <div className="field-list">
            </div>
        )
    } else {
        return ( <Spinner /> )
    }



}

export default FieldListView

