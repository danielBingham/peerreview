import { createSlice, current } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import logger from '/logger'

import { addSettingsToDictionary } from '/state/settings'
import { setCurrentUser, setSettings } from '/state/authentication'
import { setUsersInDictionary } from '/state/users'

import { 
    makeSearchParams,
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    bustRequestCache,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

export const testingSlice= createSlice({
    name: 'testing',
    initialState: {
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of users we've retrieved from the backend, keyed by
         * user.id.
         *
         * @type {object}
         */
        dictionary: {}
    },
    reducers: {

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
 * POST /testing/orcid
 *
 * Assign an ORCID iD to a user in order to test the reputation generation flow
 * for that ORCID iD.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} orcidId - A valid orcidId. 
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postTestingOrcid = function(orcidId) {
    return function(dispatch, getState) {
        dispatch(testingSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, testingSlice,
            'POST', '/testing/orcid', { orcidId: orcidId }, 
            function(responseBody) { 
                dispatch(setCurrentUser(responseBody.user))
                dispatch(setSettings(responseBody.settings))
                dispatch(addSettingsToDictionary(responseBody.settings))
                dispatch(setUsersInDictionary({ entity: responseBody.user }))
            }
        )
    }
}

export const getTestingOrcidReset = function() {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, testingSlice,
            'GET', '/testing/orcid/reset', null,
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
     cleanupRequest 
}  = testingSlice.actions

export default testingSlice.reducer
