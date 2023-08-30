import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { XCircleIcon } from '@heroicons/react/24/solid'

import { getFields, clearFieldQuery, cleanupRequest } from '/state/fields'

import Field from '/components/fields/Field'
import FieldBadge from '/components/fields/FieldBadge'

import Spinner from '/components/Spinner'

import './FieldSuggestions.css'

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
const FieldSuggestions = function(props) {

    // ======= Render State =========================================
    
    const [currentField, setCurrentField] = useState('')

    const [suggestionsError, setSuggestionsError] = useState(null)
    const [fieldSelectedError, setFieldSelectedError] = useState(false)

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
    
    const fieldSuggestions = useSelector(function(state) {
        const fields = []
        if ( state.fields.queries['FieldSuggestions'] ) {
            for(const field of state.fields.queries['FieldSuggestions'].list) {
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
        dispatch(clearFieldQuery({ name: 'FieldSuggestions' })) 
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
                    setFieldsRequestId(dispatch(getFields('FieldSuggestions', { name: fieldName })))
                } else if( fieldsRequest && fieldsRequest.state == 'fulfilled') {
                    clearSuggestions()
                    setFieldsRequestId(dispatch(getFields('FieldSuggestions', { name: fieldName })))
                }
            } else {
                clearSuggestions()
            }
        }, 250)
    }

    const onFieldsBlur = function(event) {
        if ( props.onBlur ) {
            props.onBlur(event) 
        }
    }

    const onFieldsFocus = function(event) {
        if ( props.suggestOnFocus && currentField.length > 0 ) {
            suggestFields(event.target.value)
        }
    }

    // ======= Effect Handling ======================================

    /**
     * Make sure we cleanup the fieldsRequest on unmount.
     */
    useEffect(function() {
        return function cleanup() {
            if ( fieldsRequestId ) {
                dispatch(clearFieldQuery('FieldSuggestions'))
                dispatch(cleanupRequest({ requestId: fieldsRequestId }))
            }
        }
    }, [fieldsRequestId])

    // ======= Render ===============================================

    return (
        <div className={`field-suggestions ${ props.className ? props.className : ''}`}> 
            <XCircleIcon className="clear" onClick={(e) => { setCurrentField(''); clearSuggestions()}}  /> 
            <input type="text" 
                name="fields" 
                value={currentField}
                onBlur={onFieldsBlur}
                onFocus={onFieldsFocus}
                onChange={(event) => {
                    suggestFields(event.target.value)
                    setCurrentField(event.target.value)
                }} 
                placeholder={"Start typing name to view field suggestions..."}
                autoComplete="off"
            />
        </div>
    )

}

export default FieldSuggestions
