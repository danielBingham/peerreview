import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import { makeRequest as makeTrackedRequest, 
    failRequest as failTrackedRequest, 
    completeRequest as completeTrackedRequest, 
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

import logger from '/logger'

const reputationSlice = createSlice({
    name: 'reputation',
    initialState: {
        requests: {},
        thresholds: null
    },
    reducers: {
        setThresholds: function(state, action) {
            state.thresholds = action.payload 
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
export const getThresholds = function() {
    return function(dispatch, getState) {
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(reputationSlice.actions.garbageCollectRequests())

        const requestId = uuidv4()
        const endpoint = '/reputation/thresholds'

        let payload = {
            requestId: requestId
        }

        dispatch(reputationSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            payload.ok = response.ok
            return response.json()
        }).then(function(responseBody) {
            if ( payload.ok ) {
                dispatch(reputationSlice.actions.setThresholds(responseBody))

                payload.result = responseBody 
                dispatch(reputationSlice.actions.completeRequest(payload))
            } else {
                return Promise.reject(new Error('Attempt to retrieve reputation thresholds failed.  This is a fatal error.'))
            }
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(reputationSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

export const { 
    setThresholds, 
    makeRequest, failRequest, completeRequest, cleanupRequest, garbageCollectRequests 
} = reputationSlice.actions
export default reputationSlice.reducer
