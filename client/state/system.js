import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import { 
    makeTrackedRequest,
    makeSearchParams,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

import logger from '/logger'

const systemSlice = createSlice({
    name: 'system',
    initialState: {
        requests: {},
        configuration: null
    },
    reducers: {
        reset: function(state, action) { },

        setConfiguration: function(state, action) {
            state.configuration = action.payload 
        },

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess, 
        useRequest: useRequest,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})

/**
 * GET /config
 *
 * Get the configuration from the backend.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getConfiguration = function() {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, systemSlice,
            'GET', '/config', null,
            function(config) {
                dispatch(systemSlice.actions.setConfiguration(config))
            }
        )
    }
}

export const { reset, setConfiguration, cleanupRequest } = systemSlice.actions
export default systemSlice.reducer
