import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import logger from '/logger'

import RequestError from '/errors/RequestError' 

import { 
    makeTrackedRequest,
    makeSearchParams,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

export const responsesSlice = createSlice({
    name: 'responses',
    initialState: {
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A two dimensional dictionary of responses, the first layer is keyed by
         * paper.id, the second by response.id
         *
         * @type {object}
         */
        dictionary: {},

        /**
         * A dictionary, keyed by paper.id, of lists of responses we've retrieved
         * for each paper.  The lists preserve order.
         *
         * @type {Object[]}
         */
        list: {},

        /**
         * A dictionary of counts keyed by paper.id.  The number of responses
         * on each paper.
         */
        counts: {}

    },
    reducers: {

        replaceResponse: function(state, action) {
            const response = action.payload
            if ( ! state.dictionary[response.paperId] ) {
                state.dictionary[response.paperId] = {}
            }
            if ( ! state.list[response.paperId] ) {
                state.list[response.paperId] = [] 
            }
            state.dictionary[response.paperId][response.id] = response
            const index = state.list[response.paperId].findIndex((r) => r.id == response.id)
            if ( index >= 0 ) {
                state.list[response.paperId][index] = response
            }
        },

        /**
         * @param {object} state - The redux slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - Either a single response object or a
         * list of response objects.
         */
        addResponsesToDictionary: function(state, action) {
            let responses = ( action.payload.length ? action.payload : [ action.payload ] ) 

            for(const response of responses) {
                if ( ! state.dictionary[response.paperId] ) {
                    state.dictionary[response.paperId] = {}
                }
                state.dictionary[response.paperId][response.id] = response
            }
        },

        appendResponsesToList: function(state, action) {
            let responses = (action.payload.length ? action.payload : [ action.payload ])

            for ( const response of responses) {
                if ( ! state.list[response.paperId]) {
                    state.list[response.paperId] = []
                }
                state.list[response.paperId].push(response)
            }
        },

        removeResponse: function(state, action) {
            const response = action.payload
            if ( state.list[response.paperId] ) {
                state.list[response.paperId] = state.list[response.paperId].filter((r) => r.id != response.id)
            }
            if ( state.dictionary[response.paperId] ) {
                delete state.dictionary[response.paperId][response.id]
            }
        },

        clearList: function(state, action) {
            const paperId = action.payload
            state.list[paperId] = [] 
        },

        setCounts: function(state, action) {
            state.counts = action.payload
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
 * GET /responses/count
 *
 * Gets a count of all responses on each paper.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from `state.responses.results`.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const countResponses = function() {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, responsesSlice,
            'GET', `/responses/count`, null,
            function(json) {
                const counts = json
                dispatch(responsesSlice.actions.setCounts(counts))
            }
        )
    }
}
/**
 * GET /paper/:paper_id/responses
 *
 * Get all responses in the database for a paper. Populates the list.  
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from `state.responses.results`.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getResponses = function(paperId, replaceList) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, responsesSlice,
            'GET', `/paper/${paperId}/responses`, null,
            function(json) {
                const responses = json
                if ( responses && responses.length && responses.length > 0 ) {
                    if ( replaceList ) {
                        dispatch(responsesSlice.actions.clearList(paperId))
                    }
                    dispatch(responsesSlice.actions.addResponsesToDictionary(responses))
                    dispatch(responsesSlice.actions.appendResponsesToList(responses))
                } else if ( replaceList ) {
                    dispatch(responsesSlice.actions.clearList(paperId))
                }
            }
        )
    }
}

/**
 * POST /paper/:paper_id/responses
 *
 * Create a new response.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} response - A populated response object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postResponses = function(response) {
    return function(dispatch, getState) {
        const endpoint = `/paper/${response.paperId}/responses`
        return makeTrackedRequest(dispatch, getState, responsesSlice,
            'POST', `/paper/${response.paperId}/responses`, response,
            function(returnedResponse) {
                dispatch(responsesSlice.actions.addResponsesToDictionary(returnedResponse))
                dispatch(responsesSlice.actions.appendResponsesToList(returnedResponse))
            }
        )

    }
}

/**
 * GET /paper/:paper_id/response/:id
 *
 * Get a single response.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the response we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getResponse = function(paperId, id) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, responsesSlice,
            'GET', `/paper/${paperId}/response/${id}`, null,
            function(json) {
                const response = json
                if ( response ) {
                    dispatch(responsesSlice.actions.addResponsesToDictionary(response))

                    const state = getState()
                    if ( ! state.responses.list[response.paperId] || ! state.responses.list[response.paperId].find((r) => r.id == response.id)) {
                        dispatch(responsesSlice.actions.appendResponsesToList(response))
                    }
                }
            }
        )
    }
}

/**
 * PUT /paper/:paper_id/response/:id
 *
 * Replace a response wholesale. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} response - A populated response object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const putResponse = function(response) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, responsesSlice,
            'PUT', `/paper/${response.paperId}/response/${response.id}`, response,
            function(returnedResponse) {
                dispatch(responsesSlice.actions.replaceResponse(returnedResponse))
            }
        )
    }
}

/**
 * PATCH /response/:id
 *
 * Update a response from a partial `response` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} response - A populate response object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchResponse = function(response) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, responsesSlice,
            'PATCH', `/paper/${response.paperId}/response/${response.id}`, response,
            function(returnedResponse) {
                dispatch(responsesSlice.actions.replaceResponse(returnedResponse))
            }
        )
    }
}

/**
 * DELETE /response/:id
 *
 * Delete a response. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} response - A populated response object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteResponse = function(response) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, responsesSlice,
            'DELETE', `/paper/${response.paperId}/response/${response.id}`, null,
            function(json) {
                dispatch(responsesSlice.actions.removeResponse(response))
                dispatch(responsesSlice.actions.completeRequest(payload))
            }
        )
    }
} 


export const {  
    replaceResponse, appendResponsesToList, clearList, addResponsesToDictionary, cleanupRequest 
}  = responsesSlice.actions

export default responsesSlice.reducer
