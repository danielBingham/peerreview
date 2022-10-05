import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import logger from '/logger'

import { 
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    bustRequestCache,
    useRequest,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

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

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        bustRequestCache: bustRequestCache,
        useRequest: useRequest,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
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
        const formData = new FormData()
        formData.append('file', file)

        dispatch(filesSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, filesSlice,
            'POST', `/upload`, formData,
            function(file) {
                dispatch(filesSlice.actions.addFilesToDictionary(file))
            }
        )
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
        dispatch(filesSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, filesSlice,
            'DELETE', `/file/${fileId}`, null,
            function(file) {
                dispatch(filesSlice.actions.removeFile(fileId))
            }
        )
    }
}



export const {  addFilesToDictionary, removeFile, makeRequest, failRequest, completeRequest, cleanupRequest }  = filesSlice.actions

export default filesSlice.reducer
