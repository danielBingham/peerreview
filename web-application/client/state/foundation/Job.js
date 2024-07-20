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


export const jobsSlice = createSlice({
    name: 'jobs',
    initialState: {
        /**
         * A dictionary of RequestTracker objects created by
         * `makeTrackedRequest`, keyed by uuid requestIds.
         * 
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of job keyed by the job's name.
         */
        dictionary: {}
    },
    reducers: {

        /**
         * Replace the whole dictionary.  
         *
         * @param {Object}  state   The redux state slice.
         * @param {Object}  action  The redux action.
         * @param {Object}  action.payload  The dictionary of jobs we got
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
         * @param {Object}  action.payload  The job object to add to the
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
            // Don't cache job requests.
            action.payload.cacheTTL = 0  
            cleanupTrackedRequest(state, action)
        }, 
        garbageCollectRequests: function(state, action) {
            // Don't cache job requests.
            action.payload = 0  
            garbageCollectRequests(state, action)
        }
    }

})

/**
 * GET /jobs
 *
 * Get a dictionary containing all the jobs visible to this user.  Fully
 * popoulates state.jobs.dictionary
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const getJobs = function() {
    return function(dispatch, getState) {
        const endpoint = '/jobs'

        return makeTrackedRequest(dispatch, getState, jobsSlice,
            'GET', endpoint, null,
            function(responseBody) {
                dispatch(jobsSlice.actions.setDictionary(responseBody))
            }
        )
    }
}

/**
 * POST /jobs
 *
 * Trigger a job.
 *
 * @param {string} name The name of the job we want to trigger. 
 * @param {object} data The data needed for this job.
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const postJobs = function(name, data) {
    return function(dispatch, getState) {
        const endpoint = '/jobs'

        return makeTrackedRequest(dispatch, getState, jobsSlice,
            'POST', endpoint, { name: name, data: data },
            function(responseBody) {
                dispatch(jobsSlice.actions.setInDictionary(responseBody))
            }
        )
    }
}

/**
 * GET /job/:id
 *
 * Get a job.
 *
 * @see client/state/helpers/requestTracker.js
 *
 * @param {int} id  The entity id of the job we want to retrieve.
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const getJob = function(id) {
    return function(dispatch, getState) {
        const endpoint = `/job/${id}`

        return makeTrackedRequest(dispatch, getState, jobsSlice,
            'GET', endpoint, null,
            function(responseBody) {
                dispatch(jobsSlice.actions.setInDictionary(responseBody))
            }
        )
    }
}

export const { cleanupRequest} = jobsSlice.actions

export default jobsSlice.reducer
