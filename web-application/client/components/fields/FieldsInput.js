import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'

import debounce from 'lodash.debounce'

import { useDispatch, useSelector } from 'react-redux'

import { getFields, clearFieldQuery, cleanupRequest } from '/state/fields'

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
    const [fieldSelectedError, setFieldSelectedError] = useState(false)

    const [highlightedSuggestion, setHighlightedSuggestion] = useState(0)

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
        const fields = []
        if ( state.fields.queries['suggestions'] ) {
            for(const field of state.fields.queries['suggestions'].list) {
                if ( state.fields.dictionary[field.id] ) {
                    fields.push(state.fields.dictionary[field.id])
                }
            }
        }
        return fields
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
        setFieldSelectedError(false)
        setFieldSuggestions([])
        setSuggestionsError(null)
        setHighlightedSuggestion(0)
    }

    /**
     * Append the given field to the selected fields list.
     *
     * @param {object} field    The `field` object for the field we'd like to
     * append.  See `/server/daos/field.js::hydrateField` for the object's
     * structure.
     */
    const appendField = function(field) {
        if ( props.fields.find((f) => f.id == field.id) ) {
            setFieldSelectedError(true)
            return false
        }

        props.setFields([ ...props.fields, field])
        setCurrentField('')
        clearSuggestions()
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
    const handleCurrentFieldKeyDown = function(event) {
        if ( event.key == "Enter" ) {
            event.preventDefault()

            if (fieldSuggestions.length > 0) {
                appendField(fieldSuggestions[highlightedSuggestion])
            }
        } else if (event.key == "ArrowRight" ) {
            event.preventDefault()
            let newHighlightedSuggestion = highlightedSuggestion+1
            if ( newHighlightedSuggestion >= fieldSuggestions.length) {
                newHighlightedSuggestion = 0 
            }
            setHighlightedSuggestion(newHighlightedSuggestion)
        } else if ( event.key == "ArrowLeft") {
            event.preventDefault()
            let newHighlightedSuggestion = highlightedSuggestion-1
            if ( newHighlightedSuggestion < 0) {
                newHighlightedSuggestion =  fieldSuggestions.length-1
            }
            setHighlightedSuggestion(newHighlightedSuggestion)
        } else if (event.key == "ArrowDown" ) {
            event.preventDefault()
            let newHighlightedSuggestion = highlightedSuggestion+3
            if ( newHighlightedSuggestion > fieldSuggestions.length ) {
                newHighlightedSuggestion = newHighlightedSuggestion - fieldSuggestions.length
            }
            setHighlightedSuggestion(newHighlightedSuggestion)
        } else if ( event.key == "ArrowUp" ) {
            event.preventDefault()
            let newHighlightedSuggestion = highlightedSuggestion-3
            if ( newHighlightedSuggestion < 0 ) {
                newHighlightedSuggestion = fieldSuggestions.length + newHighlightedSuggestion
            }
            setHighlightedSuggestion(newHighlightedSuggestion)
        }

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
                    setFieldsRequestId(dispatch(getFields('suggestions', { name: fieldName })))
                } else if( fieldsRequest && fieldsRequest.state == 'fulfilled') {
                    clearSuggestions()
                    setFieldsRequestId(dispatch(getFields('suggestions', { name: fieldName })))
                }

                if ( fields.length > 0 ) {
                    let newFieldSuggestions = []
                    let count = 0
                    for(const field of fields) {
                        count += 1
                        newFieldSuggestions.push(field)
                        if ( count >= 6 ) {
                            break
                        }
                    }
                    setFieldSuggestions(newFieldSuggestions)
                }

            } else {
                clearSuggestions()
            }
        }, 250)

    }

    const onFieldsBlur = function(event) {
        clearSuggestions()

        if ( props.onBlur ) {
            props.onBlur(event) 
        }
    }

    const onFieldsFocus = function(event) {
        if ( currentField.length > 0 ) {
            suggestFields(event.target.value)
        }
    }

    // ======= Effect Handling ======================================

    useLayoutEffect(function() {
        if ( highlightedSuggestion >= fieldSuggestions.length && highlightedSuggestion !== 0) {
            setHighlightedSuggestion(0)
        }
    }, [highlightedSuggestion, fieldSuggestions ])

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
                let count = 0
                for(const field of fields) {
                    count += 1
                    newFieldSuggestions.push(field)
                    if ( count >= 6 ) {
                        break
                    }
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
                dispatch(clearFieldQuery('suggestions'))
                dispatch(cleanupRequest({ requestId: fieldsRequestId }))
            }
        }
    }, [fieldsRequestId])

    // ======= Render ===============================================
    
    let fieldList = [] 
    if ( props.fields.length > 0) {
        for(const field of props.fields) {
            fieldList.push(<Field key={field.id} id={field.id} remove={removeField} target="_blank" />)
        }
    }

    let suggestedFieldList = []
    if ( ! suggestionsError) {
        if ( fieldSuggestions.length > 0) {
            for (const [index, field] of fieldSuggestions.entries()) {

                suggestedFieldList.push(
                    <div className={ index == highlightedSuggestion ? "badge-wrapper highlighted" : "badge-wrapper" } 
                        key={field.id} 
                        onMouseDown={(event) => { event.stopPropagation(); appendField(field) }}
                    >
                        <FieldBadge id={field.id} noLink={true} />
                    </div>
                )
            }
        }
    }

    return (
        <div className={`fields-input ${props.type ? props.type : 'form'} ${ props.className ? props.className : ''}`}> 
            <h3>{ props.title }</h3>
            <div className="explanation">{ props.explanation }</div>
            <div className="selected-fields">{fieldList}</div>
            { fieldSelectedError && <div className="error">You've already added that field.</div> }
            <input type="text" 
                name="fields" 
                value={currentField}
                onKeyDown={handleCurrentFieldKeyDown} 
                onBlur={onFieldsBlur}
                onFocus={onFieldsFocus}
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
