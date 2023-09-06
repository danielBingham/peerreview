import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import setRelationsInState from './helpers/relations'

import {
    setInDictionary,
    removeEntity,
    makeQuery,
    setQueryResults,
    clearQuery,
    clearQueries
} from './helpers/state'

import { 
    makeSearchParams,
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    bustRequestCache,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

export const fieldsSlice = createSlice({
    name: 'fields',
    initialState: {
        
        // ======== Standard State ============================================
        
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of fields we've retrieved from the backend, keyed by
         * field.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of fields: /fields, /field/:id/children, and
         * /field/:id/parents
         *
         * Structure:
         * {
         *  queryName: {
         *      meta: {
         *          page: <int>,
         *          count: <int>,
         *          pageSize: <int>,
         *          numberOfPages: <int>
         *      },
         *      list: [] 
         *  },
         *  ...
         * }
         */
        queries: {}

    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setFieldsInDictionary: setInDictionary,
        removeField: removeEntity,
        makeFieldQuery: makeQuery,
        setFieldQueryResults: setQueryResults,
        clearFieldQuery: clearQuery,
        clearFieldQueries: clearQueries,

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useRequest,
        bustRequestCache: bustRequestCache,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})


/**
 * GET /fields or GET /fields?...
 *
 * Get all fields in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getFields = function(name, params) {
    return function(dispatch, getState) {

        const queryString = makeSearchParams(params)
        const endpoint = '/fields' + ( params ? '?' + queryString.toString() : '')

        dispatch(fieldsSlice.actions.makeFieldQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, fieldsSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(fieldsSlice.actions.setFieldsInDictionary({ dictionary: response.dictionary}))

                dispatch(fieldsSlice.actions.setFieldQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        )

    }
}

/**
 * POST /fields
 *
 * Create a new field.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} field - A populated field object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postFields = function(field) {
    return function(dispatch, getState) {
        const endpoint = '/fields'
        const body = field
        dispatch(fieldsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, fieldsSlice,
            'POST', endpoint, body,
            function(response) {
                dispatch(fieldsSlice.actions.setFieldsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}


/**
 * GET /field/:id
 *
 * Get a single field.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the field we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getField = function(id) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, fieldsSlice,
            'GET', `/field/${id}`, null,
            function(response) {
                dispatch(fieldsSlice.actions.setFieldsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PUT /field/:id
 *
 * Replace a field wholesale. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} field - A populated field object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const putField = function(field) {
    return function(dispatch, getState) {
        dispatch(fieldsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, fieldsSlice,
            'PUT', `/field/${field.id}`, field,
            function(response) {
                dispatch(fieldsSlice.actions.setFieldsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /field/:id
 *
 * Update a field from a partial `field` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} field - A populate field object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchField = function(field) {
    return function(dispatch, getState) {
        dispatch(fieldsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, fieldsSlice,
            'PATCH', `/field/${field.id}`, field,
            function(response) {
                dispatch(fieldsSlice.actions.setFieldsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /field/:id
 *
 * Delete a field. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} field - A populated field object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteField = function(field) {
    return function(dispatch, getState) {
        dispatch(fieldsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, fieldsSlice,
            'DELETE', `/field/${field.id}`, null,
            function(response) {
                dispatch(fieldsSlice.actions.setFieldsInDictionary({ entity: response.entity}))
            }
        )
    }
} 


export const { 
    setFieldsInDictionary, removeField, 
    makeFieldQuery, clearFieldQuery, setFieldQueryResults,
    cleanupRequest 
}  = fieldsSlice.actions

export default fieldsSlice.reducer
