import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams, Link } from 'react-router-dom'

import { CheckIcon } from '@heroicons/react/24/solid'

import { getFields, cleanupRequest } from '/state/fields'

import { FloatingMenu, FloatingMenuHeader, FloatingMenuTrigger, FloatingMenuBody, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import Spinner from '/components/Spinner'

import FieldSuggestions from '/components/fields/FieldSuggestions'
import FieldBadge from '/components/fields/FieldBadge'
import Field from '/components/fields/Field'

import './FieldFilterMenu.css'

const FieldFilterMenu = function({}) {

    // ============ Query State ===============================================
    
    const [ searchParams, setSearchParams ] = useSearchParams()
    let fieldIds = searchParams.getAll('fields')

    // ============ Render State ==============================================

    const [ fieldsInternal, setFieldsInternal ] = useState([])
    
    // ============ Request Tracking =========================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.fields.requests[requestId]
        } else {
            return null
        }
    })

    // ============ Redux State ===============================================

    const fields = useSelector(function(state) {
        const results = []
        for(const id of fieldIds) {
            if ( state.fields.dictionary[id] ) {
                results.push(state.fields.dictionary[id])
            }
        }
        return results
    })

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

    // ============ Helpers and Action Handling ======================================
    
    const setField = function(field) {
        setFieldsInternal([ ...fieldsInternal, field ])

        searchParams.delete('fields')
        for(const fieldInternal of fieldsInternal) {
            searchParams.append('fields', fieldInternal.id)
        }
        searchParams.append('fields', field.id)
        setSearchParams(searchParams)
    }

    const removeField = function(id) {
        setFieldsInternal([ ...fieldsInternal.filter((f) => f.id != id) ])

        searchParams.delete('fields')
        for(const fieldInternal of fieldsInternal) {
            if ( fieldInternal.id != id ) {
                searchParams.append('fields', fieldInternal.id)
            }
        }
        setSearchParams(searchParams)
    }

    // ============ Effect Handling ===========================================
    
    const dispatch = useDispatch() 

    useEffect(function() {
        const fieldIds = searchParams.getAll('fields')

        // We need to query for one or more of our fields.
        if ( fieldIds.length !== fields.length ) {
            setRequestId(dispatch(getFields('FieldFilterMenu', { ids: fieldIds }))) 
        } 
    }, [ searchParams ])

    useEffect(function() {
        if ( fieldIds.length == fields.length ) {
            setFieldsInternal(fields)
        }
    }, [ request])


    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ============ Render ====================================================

    let triggerView = ''
    if ( fieldsInternal.length ) {
        if ( fieldsInternal.length == 1 ) {
            triggerView = `:${fieldsInternal[0].name}`
        } else if ( fieldsInternal.length == 2 ) {
            triggerView = `:${fieldsInternal[0].name},${fieldsInternal[1].name}`
        } else {
            triggerView = `:multiple`
        }
    }

    let selectedFields = []
    for(const id of fieldIds) {
        selectedFields.push(
            <FloatingMenuItem className="selected-field" key={id} onClick={(e) => { e.preventDefault(); removeField(id); }} >
                <CheckIcon /> <Field id={id} noLink={true} />
            </FloatingMenuItem>
        )
    }

    let fieldSuggestionViews = []
    for( const field of fieldSuggestions) {
        if ( ! fieldIds.find((id) => id == field.id) ) {
            fieldSuggestionViews.push(
                <FloatingMenuItem key={field.id} onClick={(e) => { e.preventDefault(); setField(field)}} >
                    <FieldBadge id={field.id} noLink={true} />
                </FloatingMenuItem>
            )
        }
    }

    return (
        <FloatingMenu className="fields-filter-menu">
            <FloatingMenuTrigger>Taxonomy{triggerView}</FloatingMenuTrigger>
            <FloatingMenuBody>
                <FloatingMenuHeader>
                    <FieldSuggestions />
                </FloatingMenuHeader>
                <div className="scroll-pane">
                    { selectedFields }            
                    { fieldSuggestionViews }
                </div>
            </FloatingMenuBody>
        </FloatingMenu> 
    )

}

export default FieldFilterMenu
