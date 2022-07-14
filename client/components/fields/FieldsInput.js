import React, { useState, useEffect, useRef } from 'react'

import debounce from 'lodash.debounce'

import { useDispatch, useSelector } from 'react-redux'

import { getFields, clearList, cleanupRequest } from '/state/fields'

import Field from '/components/fields/Field'
import FieldBadge from '/components/fields/FieldBadge'

import Spinner from '/components/Spinner'

import './FieldsInput.css'

/**
 * Uses the Field object.
 *
 * @see `/server/daos/fields.js::hydrateField` for the structure of `field`
 * object used here.
 */

/**
 * Show an input that takes a field name, and offers suggestions for existing
 * fields. When a suggestion is clicked or "enter" is pressed with the input
 * focused, the clicked suggestion or the top suggestion respectively are added
 * to a list of selected fields, which is returned to parent components through
 * a method passed in props.
 *
 * @param {object}  props   The react props object.
 * @param {object}  props.fields   An array of `field` objects that have been selected.
 * @param {function}  props.setFields   A method to set the selected fields list.
 */
const FieldsInput = function(props) {

    // ======= Render State =========================================
    
    const [currentField, setCurrentField] = useState('')
    const [fieldSuggestions, setFieldSuggestions] = useState([])
    const [suggestionsError, setSuggestionsError] = useState(null)

    // ======= Request Tracking =====================================

    const [fieldsRequestId, setFieldsRequestId] = useState(null)
    const fieldsRequest = useSelector(function(state) {
        if ( ! fieldsRequestId ) {
            return null
        } else {
            return state.fields.requests[fieldsRequestId]
        }
    })

    // ======= Redux State ==========================================
    
    const fields = useSelector(function(state) {
        return state.fields.list
    })

    // ======= Refs =================================================

    /**
     * An ID ref to be used as the timeoutId for suggestFields to debounce the
     * field suggestions requests.
     */
    const timeoutId = useRef(null)

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    /**
     * Clear the suggestions list and all its associated state.
     */
    const clearSuggestions = function() {
        setFieldSuggestions([])
        setSuggestionsError(null)
        dispatch(clearList())
    }

    /**
     * Handle key press on input[name="field"].  Primarily, we need to watch
     * for the "enter" key, because we want to add the top suggestion to the
     * selected fields list when the enter key is pressed.
     *
     * TODO Handle arrow keys and use them to allow the user to navigate the
     * list.  Up and Down should do the obvious, Left should map to Up and
     * Right to Down.
     *
     * @param {KeyboardEvent} event    The standard Javascript KeyboardEvent
     * object passed to the event handler.
     */
    const handleCurrentFieldKeyPress = function(event) {
        if ( event.key == "Enter" ) {
            event.preventDefault()

            if (fieldSuggestions.length > 0) {
                props.setFields([ ...props.fields,fieldSuggestions[0]])
                setCurrentField('')
                clearSuggestions()
            }
        }
    }

    /**
     * Append the given field to the selected fields list.
     *
     * @param {object} field    The `field` object for the field we'd like to
     * append.  See `/server/daos/field.js::hydrateField` for the object's
     * structure.
     */
    const appendField = function(field) {
        props.setFields([ ...props.fields, field])
        setCurrentField('')
        clearSuggestions()
    }

    /**
     * Remove a field from the selected fields list.
     *
     * @param {object} field    The `field` object for the field we'd like to
     * remove.
     */
    const removeField = function(field) {
        const filteredFields = props.fields.filter((f) => f.id != field.id)
        props.setFields(filteredFields)
    }

    /**
     * Suggest possible fields matching the given field name.  Debounce the
     * request so that we don't render thrash or spam the server.
     *
     * @param {string} fieldName    The name or partial name of a field that
     * we'd like to provide suggestions for.
     */
    const suggestFields = function(fieldName) {
        if ( timeoutId.current ) {
            clearTimeout(timeoutId.current)
        }
        timeoutId.current = setTimeout(function() {
            if ( fieldName.length > 0) {
                if ( ! fieldsRequestId ) {
                    clearSuggestions()
                    setFieldsRequestId(dispatch(getFields({ name: fieldName})))
                } else if( fieldsRequest && fieldsRequest.state == 'fulfilled') {
                    clearSuggestions()
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
                clearSuggestions()
            }
        }, 250)

    }

    // ======= Effect Handling ======================================

    /**
     * Watch the `fieldsRequest` and render a new set of suggestions when it
     * completes.  Then cleanup the completed request.
     *
     * TODO Don't store elements in state.
     */
    useEffect(function() {
        if (fieldsRequest && fieldsRequest.state == 'fulfilled') {
            let newFieldSuggestions = []
            if ( fields.length > 0) {
                for(const field of fields) {
                    newFieldSuggestions.push(field)
                }
            }
            setFieldSuggestions(newFieldSuggestions)
        } else if ( fieldsRequest && fieldsRequest.state == 'failed') {
            setSuggestionsError(<div className="error">Attempt to find suggestions failed: {fieldsRequest.error}</div>) 
        }
    }, [ fieldsRequest ])

    /**
     * Make sure we cleanup the fieldsRequest on unmount.
     */
    useEffect(function() {
        return function cleanup() {
            if ( fieldsRequestId ) {
                dispatch(cleanupRequest({ requestId: fieldsRequestId }))
            }
        }
    }, [fieldsRequestId])

    // ======= Render ===============================================
    
    let fieldList = [] 
    if ( props.fields.length > 0) {
        for(const field of props.fields) {
            fieldList.push(<Field key={field.id} field={field} remove={removeField} />)
        }
    }

    let suggestedFieldList = []
    if ( ! suggestionsError) {
        if ( fieldSuggestions.length > 0) {
            for (const field of fieldSuggestions) {
                suggestedFieldList.push(<div className='badge-wrapper' key={field.id} onClick={(event) => { appendField(field) }}><FieldBadge   field={field} /></div>)
            }
        }
    }

    return (
        <div className="fields-input"> 
            <label htmlFor="fields">{ props.title }</label>
            <div className="explanation">{ props.explanation }</div>
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
                style={ ( suggestedFieldList.length > 0 || suggestionsError ? { display: 'block' } : {display: 'none' } ) } 
            >
                { suggestionsError }
                { suggestedFieldList }
            </div>
        </div>
    )

}

export default FieldsInput
