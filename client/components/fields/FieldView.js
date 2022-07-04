import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ReactMarkdown from 'react-markdown'

import { getField, cleanupRequest } from '/state/fields'

import Spinner from '/components/Spinner'

import './FieldView.css'

const FieldPage = function(props) {
    const [requestId, setRequestId] = useState(null)

    const dispatch = useDispatch()

    const request = useSelector(function(state) {
        if ( ! requestId ) {
            return null
        } else {
            return state.fields.requests[requestId]
        }
    })

    const field = useSelector(function(state) {
        return state.fields.dictionary[props.id]
    })

    useEffect(function() {
        if ( ! requestId ) {
            setRequestId(dispatch(getField(props.id)))
        }

        return function cleanup() {
            if ( request ) {
                dispatch(cleanupRequest(request))
            }
        }
    }, [])


    if ( ! field ) {
        return ( <Spinner /> )
    } else {
        return (
            <article className="field-view">
                <h1>{ field.name }</h1>
                <section className="description"><ReactMarkdown>{ field.description }</ReactMarkdown></section>
            </article>
        )
    }
}

export default FieldPage
