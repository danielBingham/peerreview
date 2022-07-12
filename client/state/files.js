import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration'
import logger from '../logger'

import RequestTracker from './helpers/requestTracker'

export const filesSlice = createSlice({
    name: 'files',
    initialState: {
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of files we've retrieved from the backend, keyed by
         * file.id.
         *
         * @type {object}
         */
        dictionary: {}

    },
    reducers: {

        /**
         * Add one or more files to the state dictionary.  
         *
         * Does NOT add them to the list.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object[] | object} action.payload - The files we want to add.  Can
         * either be an array of files or a single file object.
         */
        addFilesToDictionary: function(state, action) {
            if ( action.payload && action.payload.length ) {
                for( const file of action.payload) {
                    state.dictionary[file.id] = file
                }
            } else {
                state.dictionary[action.payload.id] = action.payload
            }
        },

        removeFile: function(state, action) {
            delete state.dictionary[action.payload.id]
        },

        // ========== Generic Request Methods =============
        // Use these methods when no extra logic is needed.  If additional
        // logic is needed for a particular request, make a reducer of the form
        // [make/fail/complete/cleanup][method][endpoint]Request().  For
        // example, makePostFilesRequest().  The reducer should take an object
        // with at least requestId defined, along with whatever all inputs it
        // needs.

        /**
         * Make a request to a file or files endpoint.
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
         * Fail a request to a file or files endpoint, usually with an error.
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
         * Complete a request to a file or files endpoint by setting the file
         * sent back by the backend in the files hash.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.result - A populated file object, must have `id` defined
         */
        completeRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
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
 * POST /upload
 *
 * Upload a new file.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} file - A populated file object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const uploadFile = function(file) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = '/upload'

        const payload = {
            requestId: requestId,
        }

        var formData = new FormData()
        formData.append('file', file)

        dispatch(filesSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            body: formData 
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(file) {
            dispatch(filesSlice.actions.addFilesToDictionary(file))

            payload.result = file 
            dispatch(filesSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(filesSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * DELETE /file/:id 
 *
 * Delete a file.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} fileId - The Id of the file we want to delete. 
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteFile = function(fileId) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = '/file/' + fileId

        const payload = {
            requestId: requestId,
        }

        dispatch(filesSlice.actions.makeRequest({requestId:requestId, method: 'DELETE', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'DELETE'
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(file) {
            dispatch(filesSlice.actions.removeFile(fileId))

            payload.result = fileId 
            dispatch(filesSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(filesSlice.actions.failRequest(payload))
        })

        return requestId
    }
}



export const {  addFilesToDictionary, removeFile, makeRequest, failRequest, completeRequest, cleanupRequest }  = filesSlice.actions

export default filesSlice.reducer
