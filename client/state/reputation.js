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
        /**
         * A dictionary of requests that have been made recently, keyed by
         * requestId.
         */
        requests: {},

        /**
         * An object containing the reputation thresholds necessary to perform
         * various actions.  Populated at the same time as config.  If this is
         * null, we shouldn't allow the user to do anything.
         */
        thresholds: null,

        /**
         * A dictionary of user reputation by field.  Keyed first by userId,
         * then by fieldId.
         */
        dictionary: {},

        /**
         * The result of the current query for each user. 
         *
         * Dictionary keyed by userId where each entry has the following
         * structure:
         * ```
         * {
         *   meta: {
         *       count: 0,
         *       pageSize: 1,
         *       numberOfPages: 1
         *   },
         *   results: []
         * }
         * ```
         */
        query: {}
    },
    reducers: {
        setThresholds: function(state, action) {
            state.thresholds = action.payload 
        },

        setInDictionary: function(state, action) {
            const userId = action.payload.userId
            const reputation = action.payload.reputation
            const fieldId = reputation.field.id

            if ( ! state.dictionary[userId] ) {
                state.dictionary[userId] = {}
            }

            state.dictionary[userId][fieldId] = reputation
        },

        setAllInDictionary: function(state, action) {
            const userId = action.payload.userId
            const results = action.payload.results

            if ( ! state.dictionary[userId] ) {
                state.dictionary[userId] = {}
            }

            for(const reputation of results) {
                state.dictionary[userId][reputation.field.id] = reputation
            }
        },

        setQuery: function(state, action) {
            const userId = action.payload.userId
            const query = action.payload.query
            state.query[userId] = query
        },

        clearQuery: function(state, action) {
            delete state.query[action.payload.userId] 
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
 * GET /reputation/thresholds
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

/**
 * GET /user/:id/reputations
 *
 * Get the configuration from the backend.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getReputations = function(userId, params) {
    return function(dispatch, getState) {
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(reputationSlice.actions.garbageCollectRequests())

        const queryString = new URLSearchParams()
        for ( const key in params ) {
            if ( Array.isArray(params[key]) ) {
                for ( const value of params[key] ) {
                    queryString.append(key+'[]', value)
                }
            } else {
                queryString.append(key, params[key])
            }
        }

        const requestId = uuidv4()
        const endpoint = `/user/${userId}/reputations${ params ? `?${queryString.toString()}` : ''}`

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
                dispatch(reputationSlice.actions.setQuery({userId: userId, query: responseBody }))

                payload.result = responseBody 
                dispatch(reputationSlice.actions.completeRequest(payload))
            } else {
                logger.error(responseBody)
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
    setThresholds, setInDictionary, setAllInDictionary, setQuery, clearQuery,
    makeRequest, failRequest, completeRequest, cleanupRequest, garbageCollectRequests 
} = reputationSlice.actions
export default reputationSlice.reducer
