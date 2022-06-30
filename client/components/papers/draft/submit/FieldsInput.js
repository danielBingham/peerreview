import React, { useState, useEffect, useRef } from 'react'

import debounce from 'lodash.debounce'

import { useDispatch, useSelector } from 'react-redux'

import { getFields, clearList, cleanupRequest } from '/state/fields'

import Field from '/components/fields/Field'

import Spinner from '/components/Spinner'

import './FieldsInput.css'

const FieldsInput = function(props) {
    // Local state
    const [currentField, setCurrentField] = useState('')
    const [fieldSuggestions, setFieldSuggestions] = useState([])

    // Request Tracking
    const [fieldsRequestId, setFieldsRequestId] = useState(null)

    const timeoutId = useRef(null)

    console.log('\n\n############### FieldsInput ###################')
    console.log(props)
    console.log('State: ')
    console.log('currentField: ' + currentField)
    console.log('FieldSuggestions: ')
    console.log(fieldSuggestions)
    console.log('FieldsRequestId: ' + fieldsRequestId)

    // Helpers
    const dispatch = useDispatch()


    const fieldsRequest = useSelector(function(state) {
        if ( ! fieldsRequestId ) {
            return null
        } else {
            return state.fields.requests[fieldsRequestId]
        }
    })

    console.log('fieldsRequest')
    console.log(fieldsRequest)

    const fields = useSelector(function(state) {
        return state.fields.list
    })

    console.log('Fields List')
    console.log(fields)

    const handleCurrentFieldKeyPress = function(event) {
        console.log('==== handleCurrentFieldKeyPress ===')
        if ( event.key == "Enter" ) {
            event.preventDefault()

            if (fieldSuggestions.length == 1) {
                props.setFields([ ...props.fields,fieldSuggestions[0]])
                setCurrentField('')
                setFieldSuggestions([])
            }
        }
        console.log('==== End handleCurrentFieldKeyPress ====')
    }

    const suggestFields = function(fieldName) {
        console.log('==== suggestFields ====')
        console.log('FieldName: "' + fieldName + '"')
        console.log('fieldsRequestId: ' + fieldsRequestId)
        console.log('TimeoutId: ' + timeoutId.current)
        if ( timeoutId.current ) {
            clearTimeout(timeoutId.current)
        }
        timeoutId.current = setTimeout(function() {
            console.log('Enough time has elapsed.  Query!')
            console.log('Running with fieldName: ' + fieldName)
            console.log('And requestId: ' + fieldsRequestId)
            console.log('And fields: ')
            console.log(fields)
            if ( fieldName.length > 0) {
                if ( ! fieldsRequestId ) {
                    console.log('No Field ID')
                    setFieldSuggestions([])
                    dispatch(clearList())
                    console.log('Lists cleared.')
                    console.log('Sending new request: ' + fieldName)
                    setFieldsRequestId(dispatch(getFields({ name: fieldName})))
                } else if( fieldsRequest && fieldsRequest.state == 'fulfilled') {
                    console.log('We have a previous finished request, send a new one.')
                    setFieldSuggestions([])
                    dispatch(clearList())
                    console.log('Lists cleared.')
                    dispatch(cleanupRequest(fieldsRequest))
                    console.log('Old request cleaned up.')
                    console.log('Sending new request: ' + fieldName)
                    setFieldsRequestId(dispatch(getFields({ name: fieldName })))
                }

                console.log('Do we have an existing list?')
                if ( fields.length > 0 ) {
                    console.log('Yes.  List: ')
                    console.log(fields)
                    let newFieldSuggestions = []
                    for(const field of fields) {
                        newFieldSuggestions.push(field)
                    }
                    console.log('Setting new field suggestions: ')
                    console.log(newFieldSuggestions)
                    setFieldSuggestions(newFieldSuggestions)
                }

            } else {
                console.log('Wiping field suggestions.')
                setFieldSuggestions([])
            }
        }, 250)
        console.log('==== End suggestFields ====')

    }

    useEffect(function() {
        console.log('==== Fields - EFFECT[fieldsRequest] ====')
        console.log('fieldsRequest')
        console.log(fieldsRequest)
        console.log('Before fieldSuggestions')
        console.log(fieldSuggestions)
        if (fieldsRequest && fieldsRequest.state == 'fulfilled') {
            console.log('Latest request finished, update the suggestions.')
            console.log('fields: ')
            console.log(fields)
            let newFieldSuggestions = []
            for(const field of fields) {
                newFieldSuggestions.push(field)
            }
            console.log('New suggestions: ')
            console.log(newFieldSuggestions)
            setFieldSuggestions(newFieldSuggestions)
        }

        console.log('fieldSuggestions')
        console.log(fieldSuggestions)
        console.log('==== END Fields - EFFECT[fieldsRequest] ====')

        return function cleanup() {
            if ( fieldsRequest ) {
                dispatch(cleanupRequest(fieldsRequest))
            }
        }
    }, [ fieldsRequest ])


    console.log('==== RENDERING ====')
    let fieldList = [] 
    for(const field of props.fields) {
        fieldList.push(<Field key={field.id} field={field} />)
    }

    console.log('fieldSuggestions')
    console.log(fieldSuggestions)
    let suggestedFieldList = []
    for (const field of fieldSuggestions) {
        suggestedFieldList.push(<Field key={field.id} field={field} />)
    }

    return (
        <div className="fields-input field-wrapper"> 
            <label htmlFor="fields">Fields</label>
            <div className="explanation">Enter up to five academic fields, subfields, or areas you believe your paper is relevant to, eg. "biology", "chemistry", or "microbiology.</div>
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
