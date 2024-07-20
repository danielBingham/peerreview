import { createSlice } from '@reduxjs/toolkit'

import { 
    makeSearchParams,
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    bustRequestCache as bustTrackedRequestCache,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests } from './helpers/requestTracker'


export const featuresSlice = createSlice({
    name: 'features',
    initialState: {
        /**
         * A dictionary of RequestTracker objects created by
         * `makeTrackedRequest`, keyed by uuid requestIds.
         * 
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of feature keyed by the feature's name.
         */
        dictionary: {}
    },
    reducers: {

        /**
         * Replace the whole dictionary.  
         *
         * @param {Object}  state   The redux state slice.
         * @param {Object}  action  The redux action.
         * @param {Object}  action.payload  The dictionary of features we got
         * from the backend.
         */ 
        setDictionary: function(state, action) {
            state.dictionary = action.payload
        },

        /**
         * Set a single item in the dictionary.
         *
         * @param {Object}  state   The redux state slice.
         * @param {Object}  action  The redux action.
         * @param {Object}  action.payload  The feature object to add to the
         * dictionary, overriding any set on its `name` key.
         */
        setInDictionary: function(state, action) {
            state.dictionary[action.payload.name] = action.payload
        },

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useRequest,
        bustRequestCache: bustTrackedRequestCache,
        cleanupRequest: function(state, action) {
            // Don't cache feature requests.
            action.payload.cacheTTL = 0  
            cleanupTrackedRequest(state, action)
        }, 
        garbageCollectRequests: function(state, action) {
            // Don't cache feature requests.
            action.payload = 0  
            garbageCollectRequests(state, action)
        }
    }

})

/**
 * GET /features
 *
 * Get a dictionary containing all the features visible to this user.  Fully
 * popoulates state.features.dictionary
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const getFeatures = function() {
    return function(dispatch, getState) {
        const endpoint = '/features'

        return makeTrackedRequest(dispatch, getState, featuresSlice,
            'GET', endpoint, null,
            function(responseBody) {
                dispatch(featuresSlice.actions.setDictionary(responseBody))
            }
        )
    }
}

/**
 * POST /features
 *
 * Insert and initialize a feature.
 *
 * @param {Object}  feature The feature we want to initialize.  At a minimum
 * feature.name must be set.
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const postFeatures = function(feature) {
    return function(dispatch, getState) {
        const endpoint = '/features'

        return makeTrackedRequest(dispatch, getState, featuresSlice,
            'POST', endpoint, feature,
            function(responseBody) {
                dispatch(featuresSlice.actions.setInDictionary(responseBody))
            }
        )
    }
}

/**
 * GET /feature/:id
 *
 * Get a feature.
 *
 * @see client/state/helpers/requestTracker.js
 *
 * @param {int} id  The entity id of the feature we want to retrieve.
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const getFeature = function(name) {
    return function(dispatch, getState) {
        const endpoint = `/feature/${name}`

        return makeTrackedRequest(dispatch, getState, featuresSlice,
            'GET', endpoint, null,
            function(responseBody) {
                dispatch(featuresSlice.actions.setInDictionary(responseBody))
            }
        )
    }
}

/**
 * PATCH /feature/:feature.entity.id
 *
 * Update a feature with partial data.
 *
 * @see client/state/helpers/requestTracker.js for mechanics. 
 *
 * @param {Object} feature  The patch for the feature.
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const patchFeature = function(feature) {
    return function(dispatch, getState) {
        const endpoint = `/feature/${feature.name}`

        return makeTrackedRequest(dispatch, getState, featuresSlice,
            'PATCH', endpoint, feature,
            function(responseBody) {
                dispatch(featuresSlice.actions.setInDictionary(responseBody))
            }
        )
    }
}

export const { bustRequestCache, cleanupRequest} = featuresSlice.actions

export default featuresSlice.reducer
