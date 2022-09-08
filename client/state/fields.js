import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

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
        setFieldInDictionary: function(state, action) {
            const field = action.payload
            state.dictionary[field.id] = field
        },

        removeField: function(state, action) {
            const field = action.payload
            delete state.dictionary[field.id]
        },

        addFieldsToDictionary: function(state, action) {
            const fields = action.payload
            if ( fields && Array.isArray(fields)) {
                for ( const field of fields) {
                    state.dictionary[field.id] = field
                }
            } else if (fields ) {
                state.dictionary[fields.id] = fields
            }
        },

        makeQuery: function(state, action) {
            const name = action.payload.name

            state.queries[name] = {
                meta: {
                    page: 1,
                    count: 0,
                    pageSize: 1,
                    numberOfPages: 1
                },
                list: [] 
            }
        },

        setQueryResults: function(state, action) {
            const name = action.payload.name
            const meta = action.payload.meta
            const result = action.payload.result

            state.queries[name].meta = meta
            state.queries[name].list = result
        },

        clearQuery: function(state, action) {
            const name = action.payload.name

            delete state.queries[name]
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
export const getFields = function(name, params) {
    return function(dispatch, getState) {
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(fieldsSlice.actions.garbageCollectRequests())

        const queryString = new URLSearchParams(params)

        const requestId = uuidv4() 
        const endpoint = '/fields' + ( params ? '?' + queryString.toString() : '')

        let payload = {
            requestId: requestId
        }
        let responseOk = false

        dispatch(fieldsSlice.actions.makeQuery({ name: name }))
        dispatch(fieldsSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            responseOk = response.ok
            return response.json()
        }).then(function(responseBody) {
            if ( responseOk ){
                const resultIds = []
                if ( responseBody.result.length > 0 ) {
                    for(const field of responseBody.result) {
                        resultIds.push(field.id)
                        dispatch(fieldsSlice.actions.setFieldInDictionary(field))
                    }
                }
                dispatch(fieldsSlice.actions.setQueryResults({ 
                    name: name, 
                    meta: responseBody.meta,
                    result: resultIds 
                }))

                payload.result = responseBody 
                dispatch(fieldsSlice.actions.completeRequest(payload))
            } else {
                payload.error = responseBody.error
                dispatch(fieldsSlice.actions.failRequest(payload))
            }
        }).catch(function(error) {
            logger.error(error)

            payload.error = 'frontend-error'
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
        const configuration = getState().system.configuration

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
            dispatch(fieldsSlice.actions.setFieldInDictionary(returnedField))

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
        const configuration = getState().system.configuration

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
            dispatch(fieldsSlice.actions.setFieldInDictionary(field))

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
        const configuration = getState().system.configuration

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
            dispatch(fieldsSlice.actions.setFieldInDictionary(returnedField))

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
        const configuration = getState().system.configuration

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
            dispatch(fieldsSlice.actions.setFieldInDictionary(returnedField))

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
        const configuration = getState().system.configuration

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


export const { 
    setFieldInDictionary, removeField, addFieldsToDictionary,
    makeQuery, clearQuery, setQueryResults,
    makeRequest, failRequest, completeRequest, cleanupRequest }  = fieldsSlice.actions

export default fieldsSlice.reducer
