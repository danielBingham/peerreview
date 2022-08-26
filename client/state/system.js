import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import { makeRequest as makeTrackedRequest, 
    failRequest as failTrackedRequest, 
    completeRequest as completeTrackedRequest, 
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

        makeRequest: makeTrackedRequest, 
        failRequest: failTrackedRequest, 
        completeRequest: completeTrackedRequest,
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
        // Cleanup dead requests before making a new one.
        dispatch(systemSlice.actions.garbageCollectRequests())

        const requestId = uuidv4()
        const endpoint = '/config'

        let payload = {
            requestId: requestId
        }

        dispatch(systemSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            payload.ok = response.ok
            return response.json()
        }).then(function(config) {
            if ( payload.ok ) {
                dispatch(systemSlice.actions.setConfiguration(config))

                payload.result = config 
                dispatch(systemSlice.actions.completeRequest(payload))
            } else {
                return Promise.reject(new Error('Attempt to retrieve configuration failed.  This is a fatal error.'))
            }
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(systemSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

export const { reset, setConfiguration, makeRequest, failRequest, completeRequest, cleanupRequest, garbageCollectRequests } = systemSlice.actions
export default systemSlice.reducer
