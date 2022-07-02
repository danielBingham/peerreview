import React, { useState, useEffect, useRef } from 'react'

import debounce from 'lodash.debounce'

import { useDispatch, useSelector } from 'react-redux'

import { getFields, clearList, cleanupRequest } from '/state/fields'

import Field from '/components/fields/Field'
import FieldBadge from '/components/fields/FieldBadge'

import Spinner from '/components/Spinner'

import './FieldsInput.css'

const FieldsInput = function(props) {
    // Local state
    const [currentField, setCurrentField] = useState('')
    const [fieldSuggestions, setFieldSuggestions] = useState([])

    // Request Tracking
    const [fieldsRequestId, setFieldsRequestId] = useState(null)

    const timeoutId = useRef(null)

    // Helpers
    const dispatch = useDispatch()


    const fieldsRequest = useSelector(function(state) {
        if ( ! fieldsRequestId ) {
            return null
        } else {
            return state.fields.requests[fieldsRequestId]
        }
    })

    const fields = useSelector(function(state) {
        return state.fields.list
    })

    const handleCurrentFieldKeyPress = function(event) {
        if ( event.key == "Enter" ) {
            event.preventDefault()

            if (fieldSuggestions.length > 0) {
                props.setFields([ ...props.fields,fieldSuggestions[0]])
                setCurrentField('')
                setFieldSuggestions([])
            }
        }
    }

    const appendField = function(field) {
        props.setFields([ ...props.fields, field])
        setCurrentField('')
        setFieldSuggestions([])
    }

    const suggestFields = function(fieldName) {
        if ( timeoutId.current ) {
            clearTimeout(timeoutId.current)
        }
        timeoutId.current = setTimeout(function() {
            if ( fieldName.length > 0) {
                if ( ! fieldsRequestId ) {
                    setFieldSuggestions([])
                    dispatch(clearList())
                    setFieldsRequestId(dispatch(getFields({ name: fieldName})))
                } else if( fieldsRequest && fieldsRequest.state == 'fulfilled') {
                    setFieldSuggestions([])
                    dispatch(clearList())
                    dispatch(cleanupRequest(fieldsRequest))
                    setFieldsRequestId(dispatch(getFields({ name: fieldName })))
                }

                if ( fields.length > 0 ) {
                    let newFieldSuggestions = []
                    for(const field of fields) {
                        newFieldSuggestions.push(field)
                    }
                    setFieldSuggestions(newFieldSuggestions)
                }

            } else {
                setFieldSuggestions([])
            }
        }, 250)

    }

    useEffect(function() {
        if (fieldsRequest && fieldsRequest.state == 'fulfilled') {
            let newFieldSuggestions = []
            for(const field of fields) {
                newFieldSuggestions.push(field)
            }
            setFieldSuggestions(newFieldSuggestions)
        }

        return function cleanup() {
            if ( fieldsRequest ) {
                dispatch(cleanupRequest(fieldsRequest))
            }
        }
    }, [ fieldsRequest ])


    let fieldList = [] 
    for(const field of props.fields) {
        fieldList.push(<Field key={field.id} field={field} />)
    }

    let suggestedFieldList = []
    for (const field of fieldSuggestions) {
        suggestedFieldList.push(<div className='badge-wrapper' key={field.id} onClick={(event) => { appendField(field) }}><FieldBadge   field={field} /></div>)
    }

    return (
        <div className="fields-input field-wrapper"> 
            <label htmlFor="fields">Fields</label>
            <div className="explanation">Enter up to five fields, subfields, or areas you believe your paper is relevant to, eg. "biology", "chemistry", or "microbiology.</div>
            <div className="selected-fields">{fieldList}</div>
            <input type="text" 
                name="fields" 
                value={currentField}
                onKeyPress={handleCurrentFieldKeyPress} 
                onChange={(event) => {
                    suggestFields(event.target.value)
                    setCurrentField(event.target.value)
                }} 
            />
            <div className="field-suggestions" 
                style={ ( suggestedFieldList.length > 0 ? { display: 'block' } : {display: 'none' } ) } 
            >
                {suggestedFieldList}
            </div>
        </div>
    )

}

export default FieldsInput
