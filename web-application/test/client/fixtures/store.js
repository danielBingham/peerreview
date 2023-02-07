import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'
import { createSlice } from '@reduxjs/toolkit'

import { 
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from '../../../client/state/helpers/requestTracker'

/****
 * Configure a mock store.  Only includes the features necessary to test the request tracking 
 * and to reset the store.
 */

const testSlice = createSlice({
    name: 'test',
    initialState: {
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

    },
    reducers: {
        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        cleanupRequest: cleanupTrackedRequest, 
        useRequest: useRequest,
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})

export const getRequest = function(onSuccess) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, testSlice,
            'GET', '/test', null,
            function(responseBody ) {
                onSuccess(responseBody)
            }
        )
    }
}

export const postRequest = function(body, onSuccess) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, testSlice,
            'POST', '/test', body,
            function(responseBody ) {
                onSuccess(responseBody)
            }
        )
    }
}

export const patchRequest = function(body, onSuccess) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, testSlice,
            'PATCH', '/test', body,
            function(responseBody ) {
                onSuccess(responseBody)
            }
        )
    }
}

export const putRequest = function(body, onSuccess) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, testSlice,
            'PUT', '/test', body,
            function(responseBody ) {
                onSuccess(responseBody)
            }
        )
    }
}

export const deleteRequest = function(onSuccess) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, testSlice,
            'DELETE', '/test', null,
            function(responseBody ) {
                onSuccess(responseBody)
            }
        )
    }
}

const systemSlice = createSlice({
    name: 'system',
    initialState: {
        configuration: {
            backend: '/api/0.0.0'
        }
    },
    reducers: {
        reset: function(state, action) {}
    }
})

export const { reset } = systemSlice.actions

const reducers = combineReducers({
    system: systemSlice.reducer,
    test: testSlice.reducer
})

const rootReducer = function(state, action) {
    if (action.type === 'system/reset') {
        state = undefined
    }
    return reducers(state,action)
}

export default configureStore({
    reducer: rootReducer
})
