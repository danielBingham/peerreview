import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import { addSettingsToDictionary } from '/state/settings'
import { setCurrentUser, setSettings } from '/state/authentication'
import { setUsersInDictionary } from '/state/users'

import { 
    makeTrackedRequest,
    makeSearchParams,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    bustRequestCache,
    useRequest,
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

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useRequest,
        bustRequestCache: bustRequestCache,
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
        const endpoint = '/reputation/thresholds'

        return makeTrackedRequest(dispatch, getState, reputationSlice,
            'GET', endpoint, null,
            function(responseBody) {
                dispatch(reputationSlice.actions.setThresholds(responseBody))
            }
        )
    }
}

/**
 * GET /user/:id/reputations
 *
 * Get a list of reputation per field items for a user.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getReputations = function(userId, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params)
        const endpoint = `/user/${userId}/reputations${ params ? `?${queryString.toString()}` : ''}`

        return makeTrackedRequest(dispatch, getState, reputationSlice,
            'GET', endpoint, null,
            function(responseBody) {
                dispatch(reputationSlice.actions.setQuery({userId: userId, query: responseBody }))
                dispatch(reputationSlice.actions.setAllInDictionary({ userId: userId, results: responseBody.results  }))
            }
        )
    }
}

/**
 * GET /user/:user_id/reputation/:field_id
 *
 * Get the reputation for a particular user in a particular field.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getReputation = function(userId, fieldId) {
    return function(dispatch, getState) {
        const endpoint = `/user/${userId}/reputation/${fieldId}`
        return makeTrackedRequest(dispatch, getState, reputationSlice,
            'GET', endpoint, null,
            function(responseBody) {
                dispatch(reputationSlice.actions.setInDictionary({ userId: userId, fieldId: fieldId, reputation: responseBody }))
            }
        )
    }
}

/**
 * GET /user/:user_id/reputation/initialization
 *
 * Initialize a user's reputation.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const initializeReputation = function(userId) {
    return function(dispatch, getState) {
        dispatch(reputationSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, reputationSlice,
            'GET', `/user/${userId}/reputation/initialization`, null,
            function(responseBody) {
                dispatch(setCurrentUser(responseBody.user))
                dispatch(setSettings(responseBody.settings))
                dispatch(addSettingsToDictionary(responseBody.settings))
                dispatch(setUsersInDictionary({ entity: responseBody.user }))
            }
        )
    }
}



export const { 
    setThresholds, setInDictionary, setAllInDictionary, setQuery, clearQuery, cleanupRequest 
} = reputationSlice.actions
export default reputationSlice.reducer
