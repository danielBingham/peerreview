import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration'
import logger from '../logger'

import { makeRequest as makeTrackedRequest, 
    failRequest as failTrackedRequest, 
    completeRequest as completeTrackedRequest, 
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

export const fieldsSlice = createSlice({
    name: 'fields',
    initialState: {
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
         * A list of fields returned from /fields/query.  We need to use a list
         * here, because we need to preserve the order returned from the
         * backend.  The query can include a `sort` parameter.  We can only run
         * one query at a time, subsequent queries will be assumed to build on
         * it. If you need to start a new query, call the `newQuery` action.
         */
        list: [] 
    },
    reducers: {

        /**
         * Add fields to the dictionary, or update fields already in the
         * dictionary.
         *
         * Also adds the parents and children, linking them to their parents
         * and children where possible.
         *
         * @param {object} state    The redux state slice.
         * @param {object} action   The redux action we're reducing.
         * @param {object} action   The action payload to be reduced, in this
         * case a list of field objects to be added to the store.
         */
        addFieldsToDictionary: function(state, action) {
            const fields = action.payload
            if ( fields && Array.isArray(fields) ) {
                for(const field of action.payload) {
                    state.dictionary[field.id] = field
                }
            } else if ( fields ) {
                state.dictionary[fields.id] = fields
            }
        },

        appendFieldsToList: function(state, action) {
            if ( action.payload && Array.isArray(action.payload)) {
                const fields = action.payload
                state.list.push(...fields)
            } else if(action.payload) {
                state.list.push(action.payload)
            }
        },

        updateField: function(state, action) {
            const field = action.payload
            state.dictionary[field.id] = field

            const index = state.list.findIndex((f) => f.id == field.id)
            state.list[index] = field
        },

        removeField: function(state, action) {
            const field = action.payload
            delete state.dictionary[field.id]
            state.list = state.list.filter((f) => f.id != field.id)
        },

        /**
         * Reset the query so that you can start a new one.
         *
         * Doesn't take a payload.
         *
         * @param {object} state - the redux state slice.
         * @param {object} action - the redux action we're reducing.
         */
        clearList: function(state, acton) {
            state.list = []
        },

        // ========== Request Tracking Methods =============

        makeRequest: makeTrackedRequest, 
        failRequest: failTrackedRequest, 
        completeRequest: completeTrackedRequest,
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
export const getFields = function(params) {
    return function(dispatch, getState) {
        // Cleanup dead requests before making a new one.
        dispatch(fieldsSlice.actions.garbageCollectRequests())

        const queryString = new URLSearchParams(params)

        const requestId = uuidv4() 
        const endpoint = '/fields' + ( params ? '?' + queryString.toString() : '')

        let payload = {
            requestId: requestId
        }


        dispatch(fieldsSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(fields) {
            dispatch(fieldsSlice.actions.addFieldsToDictionary(fields))
            dispatch(fieldsSlice.actions.appendFieldsToList(fields))

            payload.result = fields
            dispatch(fieldsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(fieldsSlice.actions.failRequest(payload))
        })

        return requestId
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
        // Cleanup dead requests before making a new one.
        dispatch(fieldsSlice.actions.garbageCollectRequests())

        const requestId = uuidv4()
        const endpoint = '/fields'

        const payload = {
            requestId: requestId
        }

        dispatch(fieldsSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(field)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedField) {
            dispatch(fieldsSlice.actions.updateField(returnedField))

            payload.result = returnedField
            dispatch(fieldsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(fieldsSlice.actions.failRequest(payload))
        })

        return requestId
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
        // Cleanup dead requests before making a new one.
        dispatch(fieldsSlice.actions.garbageCollectRequests())

        const requestId = uuidv4()
        const endpoint = '/field/' + id

        const payload = {
            requestId: requestId
        }

        dispatch(fieldsSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(field) {
            dispatch(fieldsSlice.actions.updateField(field))

            payload.result = field
            dispatch(fieldsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(fieldsSlice.actions.failRequest(payload))
        })

        return requestId
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
        // Cleanup dead requests before making a new one.
        dispatch(fieldsSlice.actions.garbageCollectRequests())
    
        const requestId = uuidv4()
        const endpoint = '/field/' + field.id

        const payload = {
            requestId: requestId
        }

        dispatch(fieldsSlice.actions.makeRequest({requestId: requestId, method: 'PUT', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(field)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()

            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }

        }).then(function(returnedField) {
            dispatch(fieldsSlice.actions.updateField(returnedField))

            payload.result = returnedField
            dispatch(fieldsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(fieldsSlice.actions.failRequest(payload))
        })

        return requestId
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
        // Cleanup dead requests before making a new one.
        dispatch(fieldsSlice.actions.garbageCollectRequests())

        const requestId = uuidv4()
        const endpoint = '/field/' + field.id

        const payload = {
            requestId: requestId
        }

        dispatch(fieldsSlice.actions.makeRequest({requestId: requestId, method: 'PATCH', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(field)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedField) {
            dispatch(fieldsSlice.actions.updateField(returnedField))

            payload.result = returnedField
            dispatch(fieldsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(fieldsSlice.actions.failRequest(payload))
        })

        return requestId
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
        // Cleanup dead requests before making a new one.
        dispatch(fieldsSlice.actions.garbageCollectRequests())

        const requestId = uuidv4()
        const endpoint = '/field/' + field.id

        const payload = {
            requestId: requestId,
            result: field.id
        }
        
        dispatch(fieldsSlice.actions.makeRequest({requestId: requestId, method: 'DELETE', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if( response.ok ) {
                dispatch(fieldsSlice.actions.removeField(field))
                dispatch(fieldsSlice.actions.completeRequest(payload))
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(fieldsSlice.actions.failRequest(payload))
        })

        return requestId
    }
} 


export const { addFieldsToDictionary, addFieldsWithoutRelationshipsToDictionary, appendFieldsToList, updateField, clearList, makeRequest, failRequest, completeRequest, cleanupRequest }  = fieldsSlice.actions

export default fieldsSlice.reducer
