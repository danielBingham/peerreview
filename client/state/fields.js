import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration'
import logger from '../logger'

import RequestTracker from './helpers/requestTracker'

export const fieldsSlice = createSlice({
    name: 'field',
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
    },
    reducers: {
        // ========== GET /fields ==================

        /**
         * The GET request to /fields succeeded.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.result - An array of populated field objects
         */
        completeGetFieldsRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            if ( action.payload.result ) {
                for (const field of action.payload.result) {
                    state.dictionary[field.id] = field
                }
            }
        },

        // ========== DELETE /field/:id =================

        /**
         * Finish the DELETE /field/:id call.  In this case, the call returns
         * the id of the deleted field and we need to delete them from state on
         * our side.  
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.result - The id of the deleted field
         */
        completeDeleteFieldRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
            delete state.dictionary[action.payload.result]
        },

        // ========== Generic Request Methods =============
        // Use these methods when no extra logic is needed.  If additional
        // logic is needed for a particular request, make a reducer of the form
        // [make/fail/complete/cleanup][method][endpoint]Request().  For
        // example, makePostFieldsRequest().  The reducer should take an object
        // with at least requestId defined, along with whatever all inputs it
        // needs.

        /**
         * Make a request to a field or fields endpoint.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {string} action.payload.method - One of the HTTP verbs
         * @param {string} action.payload.endpoint - The endpoint we're making the request to
         */
        makeRequest: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker(action.payload.method, action.payload.endpoint)
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Fail a request to a field or fields endpoint, usually with an error.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {int} action.payload.status - (Optional) The status code returned with the response.
         * @param {string} action.payload.error - (Optional) A string error message.
         */
        failRequest: function(state, action) {
            RequestTracker.failRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Complete a request to a field or fields endpoint by setting the field
         * sent back by the backend in the fields hash.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.result - A populated field object, must have `id` defined
         */
        completeRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            state.dictionary[action.payload.result.id] = action.payload.result
        },

        /**
         * Cleanup a request by removing it from our request hash.  Once we're
         * done with a request, we don't need to keep its tracking around.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         */
        cleanupRequest: function(state, action) {
            delete state.requests[action.payload.requestId]
        }
    }
})


/**
 * GET /fields
 *
 * Get all fields in the database.  Populates state.fields.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getFields = function() {
    return function(dispatch, getState) {
        const requestId = uuidv4() 
        const endpoint = '/fields'

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
            payload.result = fields
            dispatch(fieldsSlice.actions.completeGetFieldsRequest(payload))
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
                dispatch(fieldsSlice.actions.completeDeleteFieldRequest(payload))
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


export const { completeGetFieldsRequest, completeDeleteFieldRequest, makeRequest, failRequest, completeRequest, cleanupRequest }  = fieldsSlice.actions

export default fieldsSlice.reducer