import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Field from '../Field'
import { getFields, clearList, cleanupRequest } from '/state/fields'

import Spinner from '/components/Spinner'

import './FieldListView.css'

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
        return state.fields.list
    })

    useEffect(function() {
        if ( ! requestId ) {
            dispatch(clearList())
            setRequestId(dispatch(getFields()))
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }
    }, [ request ])

    let fieldViews = []
    if ( fields ) {
        for (const field of fields) {
            if ( ! props.id && field.parents.length == 0) {
                fieldViews.push(<Field key={field.id} field={field} />)
            } else if ( props.id && field.parents.find((p) => p == props.id)) {
                fieldViews.push(<Field key={field.id} field={field} />)
            }
        }
    }
    if ( fieldViews.length == 0) {
        fieldViews = ( <div className="empty-list">No fields found.</div> )
    }

    if ( fields || ( request && request.state == 'fulfilled')) {
        return (
            <div className="field-list">
                <div className="header">
                    { props.id ? <h2>Sub-Fields</h2> : <h2>Fields</h2> }
                </div>
                {fieldViews}
            </div>
        )
    } else {
        return ( <Spinner /> )
    }



}

export default FieldListView
