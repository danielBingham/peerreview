import React, { useState, useEffect } from 'react'

import debounce from 'lodash.debounce'

import { useDispatch, useSelector } from 'react-redux'

import { queryFields, newQuery, cleanupRequest } from '../../../state/fields'

import Spinner from '../../Spinner'

const FieldsInput = function(props) {

    // Local state
    const [currentField, setCurrentField] = useState('')
    const [fieldSuggestions, setFieldSuggestions] = useState([])

    // Request Tracking
    const [queryFieldsRequestId, setQueryFieldsRequestId] = useState(null)

    // Helpers
    const dispatch = useDispatch()


    const queryFieldsRequest = useSelector(function(state) {
        if ( ! queryFieldsRequestId ) {
            return null
        } else {
            return state.fields.requests[queryFieldsRequestId]
        }
    })

    const fields = useSelector(function(state) {
        return state.fields.dictionary
    })

    const handleCurrentFieldKeyPress = function(event) {
        if ( event.key == "Enter" ) {
            event.preventDefault()

            if (fieldSuggestions.length == 1) {
                props.setFields([ ...props.fields,fieldSuggestions[0]])
                setCurrentField('')
                setFieldSuggestions([])
            }
        }
    }

    const suggestFields = debounce(function(fieldName) {
        if ( fieldName.length > 0) {
            if ( ! queryFieldsRequestId ) {
                dispatch(newQuery())
                setQueryFieldsRequestId(dispatch(queryFields(fieldName)))
            } else if( queryFieldsRequest && queryFieldsRequest.state == 'fulfilled') {
                dispatch(newQuery())
                dispatch(cleanupRequest(queryFieldsRequestId))
                setQueryFieldsRequestId(dispatch(queryFields(fieldName)))
            }

            let newFieldSuggestions = []
            for(let id in fields) {
                if (fields[id].name.toLowerCase().includes(currentField.toLowerCase()) ) {
                    newFieldSuggestions.push(fields[id])
                }
            }
            setFieldSuggestions(newFieldSuggestions)

        } else {
            setFieldSuggestions([])
        }

    }, 250)

    useEffect(function() {
        if (queryFieldsRequest && queryFieldsRequest.state == 'fulfilled') {
            let newFieldSuggestions = []
            for(let id in fields) {
                if (fields[id].name.toLowerCase().includes(currentField.toLowerCase()) ) {
                    newFieldSuggestions.push(fields[id])
                }
            }
            setFieldSuggestions(newFieldSuggestions)
        }

        return function cleanup() {
            if ( queryFieldsRequest ) {
                dispatch(cleanupRequest(queryFieldsRequestId))
            }
        }
    }, [ queryFieldsRequest ])

    let fieldList = [] 
    props.fields.forEach(function(field) {
        fieldList.push(<span key={field.name} className="field">{field.name}</span>)
    })

    let suggestedFieldList = []
    fieldSuggestions.forEach(function(field) {
        suggestedFieldList.push(<span key={field.name} className="field">{field.name}</span>)
    })

    return (
        <div className="fields"> 
            <label htmlFor="fields">Fields:</label>
            <input type="text" 
                name="fields" 
                value={currentField}
                onKeyPress={handleCurrentFieldKeyPress} 
                onChange={(event) => {
                    suggestFields(event.target.value)
                    setCurrentField(event.target.value)
                }} />
            <div className="field-suggestions">{suggestedFieldList}</div>
            <div className="selected-fields">{fieldList}</div>
        </div>
    )

}

export default FieldsInput
