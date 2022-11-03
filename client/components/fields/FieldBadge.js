import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import { getField, cleanupRequest } from '/state/fields'

import Field from './Field'
import './FieldBadge.css'

/**
 * Show a Badge for a field.  This shows the tag, as well as the number of
 * papers in the field and a description for it.
 *
 * TODO Show an actual number of papers, rather than a dummy.
 *
 * @param {object} props    The react props object.
 * @param {object} props.field  The field we want to display a badge for.
 */
const FieldBadge = function(props) {

    // ======= Request Tracking =====================================
    
    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.fields.requests[requestId]
        }
    })

    // ======= Redux State ==========================================
    
    const field = useSelector(function(state) {
        return state.fields.dictionary[props.id]
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! field ) {
            setRequestId(dispatch(getField(props.id)))
        }
    }, [ props.id ])

    /**
     * Make sure we cleanup the request on unmount.
     */
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [requestId])


    // ======= Render ===============================================
    
    return (
        <div className='field-badge'>
            <div className="wrapper"><Field field={field} noLink={props.noLink} /></div>
            <div className="description">{ field.description }</div>
        </div>
    )
}

export default FieldBadge
