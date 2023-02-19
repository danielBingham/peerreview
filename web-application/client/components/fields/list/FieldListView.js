import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import FieldBadge from '../FieldBadge'
import { getFields, clearQuery, cleanupRequest } from '/state/fields'

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

    // ======= Redux State ==========================================
    const title = props.title ? props.title : 'FieldListView' 

    const fields = useSelector(function(state) {
        if ( ! state.fields.queries[title] ) {
            return []
        }

        const fields = []
        for ( const id of state.fields.queries[title].list) {
            if ( state.fields.dictionary[id] ) {
                fields.push(state.fields.dictionary[id])
            }
        }
        return fields
    })

    const meta = useSelector(function(state) {
        if ( ! state.fields.queries[title] ) {
            return {
                count: 0,
                page: 1,
                pageSize: 1,
                numberOfPages: 1
            }
        }
        return state.fields.queries[title].meta 
    })

    // ======= Effect Handling ======================================
    const dispatch = useDispatch()

    // Make the request to get the fields. We only need to do this on mount.
    useEffect(function() {
        const params = { }

        if ( props.parent) {
            params.parent = props.parent
        } else if ( props.child ) {
            params.child = props.child
        } else {
            params.depth = 1
        }

        const page = searchParams.get(`${title}-page`)
        if ( page ) {
            params.page = page
        }

        setRequestId(dispatch(getFields(title, params)))
            
            
    }, [ props.parent, props.child, searchParams ])

    // Cleanup when we're done, or any time we make a new request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================


    // Wait for the request to finish before displaying.  That ensures we don't
    // flicker with partial data.
    let content = ( <Spinner /> ) 
    if (request && request.state == 'fulfilled') {
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
    }

    return (
        <div className="field-list">
            <div className="header">
                <h2>{ title }</h2>
            </div>
            {content}
            { meta.numberOfPages > 1 && <PaginationControls prefix={title} counts={meta} /> }
        </div>
    )
}

export default FieldListView

