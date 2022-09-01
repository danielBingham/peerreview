import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import FieldBadge from '../FieldBadge'
import { getFields, countFields, clearList, cleanupRequest } from '/state/fields'

import Spinner from '/components/Spinner'
import PaginationControls from '/components/PaginationControls'

import './FieldListView.css'

/**
 * Display a tag cloud of Fields with a header.  Optionally takes a field.id in
 * props, in which case it displays only the direct children of the field with
 * that id. If no id is passed, displays the top level fields (fields with no
 * parents).
 *
 * @param {object} props    The react props of this component.
 * @param {int} props.id    The id of the field who's children we want to
 * display. 
 */
const FieldListView = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Request Tracking =====================================
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.fields.requests[requestId]
        } else {
            return null
        }
    })

    const [ countRequestId, setCountRequestId ] = useState(null)
    const countRequest = useSelector(function(state) {
        if ( countRequestId ) {
            return state.fields.requests[countRequestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const fields = useSelector(function(state) {
        return state.fields.list
    })

    const counts = useSelector(function(state) {
        return state.fields.counts
    })

    // ======= Effect Handling ======================================
    const dispatch = useDispatch()

    // Make the request to get the fields. We only need to do this on mount.
    useEffect(function() {
        dispatch(clearList())

        const params = {
            parent: 'root' 
        }
        if ( props.id ) {
            params.parent = props.id
        }  

        const page = searchParams.get('field-page')
        if ( page ) {
            params.page = page
        }

        console.log('Requesting fields: ')
        console.log(params)
        setCountRequestId(dispatch(countFields(params)))
        setRequestId(dispatch(getFields(params)))
    }, [ props.id, searchParams ])

    // Cleanup when we're done, or any time we make a new request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // Cleanup when we're done, or any time we make a new request.
    useEffect(function() {
        return function cleanup() {
            if ( countRequestId ) {
                dispatch(cleanupRequest({ requestId: countRequestId }))
            }
        }
    }, [ countRequestId ])


    // ======= Render ===============================================


    // Wait for the request to finish before displaying.  That ensures we don't
    // flicker with partial data.
    let content = ( <Spinner /> ) 
    if (request && request.state == 'fulfilled' && countRequest && countRequest.state == 'fulfilled') {
        content = []
        if ( fields ) {
            for ( const field of fields)  {
                content.push(<FieldBadge key={field.id} id={field.id} />)
            }
        }
        if ( content.length == 0) {
            content = ( <div className="empty-list">No fields found.</div> )
        }
    } else if ( (request && request.state == 'failed') ) {
        content = ( <div className="error">Request for fields failed with error: { request.error }. Please report this as a bug.</div> )
    } else if ( countRequest && countRequest.state == 'failed') {
        content = ( <div className="error">Request for fields failed with error: { countRequest.error }. Please report this as a bug.</div> )
    }

    return (
        <div className="field-list">
            <div className="header">
                { props.id ? <h2>Sub-Fields</h2> : <h2>Fields</h2> }
            </div>
            {content}
            <PaginationControls prefix={'field'} counts={counts} />
        </div>
    )
}

export default FieldListView

