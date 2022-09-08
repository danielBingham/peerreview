import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ReactMarkdown from 'react-markdown'

import { getField, cleanupRequest } from '/state/fields'

import Spinner from '/components/Spinner'

import './FieldView.css'

/**
 * Show the details of a single field.
 *
 * @param {object} props    The React props object.
 * @param {int} props.id    The id of the field we'd like to show details for.
 */
const FieldView = function(props) {

    console.log(`\n\n Rendering FieldView(${props.id}).`)

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
        if ( ! props.id ) {
            return null
        }
        return state.fields.dictionary[props.id]
    })

    const reputationThresholds = useSelector(function(state) {
        return state.reputation.thresholds
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    /**
     * Request the field matching the id given in props, to ensure we have it.
     */
    useEffect(function() {
        if ( ! props.id ) {
            console.error(`Can't render FieldView with out an 'id' number.`)
        } else { 
            console.log(`ID: ${props.id}`)
            setRequestId(dispatch(getField(props.id)))
        }
    }, [ props.id ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    // ======= Render ===============================================

    let content = ( <Spinner /> )
    if ( request && request.state == 'fulfilled' ) {
        if ( field ) {
            content = ( 
                <div className="field-details">
                    <h1>{ field.name }</h1>
                    <section className="description"><ReactMarkdown>{ field.description }</ReactMarkdown></section>
                    <div className="reputation-thresholds">
                        <h2>Reputation Requirements</h2>
                        <div className="publish"><span className="label">Publish</span>: { reputationThresholds.publish * field.averageReputation }</div>
                        <div className="review"><span className="label">Review</span>: { reputationThresholds.review * field.averageReputation }</div>
                        <div className="referee"><span className="label">Vote/Respond</span>: { reputationThresholds.referee * field.averageReputation }</div>
                    </div>
                </div>
            )
        } else {
          content = (  <div className="field-not-found">We weren't able to find that field.</div> )
        }
    } else if ( request && request.state == 'failed') {
        content = ( <div className="error">Something went wrong with fetching the field details from the backend: { request.error }.  Please report this as a bug.</div> )
    } else if ( ! props.id ) {
        content = (  <div className="field-not-found">We weren't able to find that field.</div> )
    }

    return (
        <article className="field-view">
            { content }
        </article>
    )
}

export default FieldView 
