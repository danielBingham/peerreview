import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration'
import logger from '../logger'

import RequestTracker from './helpers/requestTracker'

export const draftsSlice = createSlice({
    name: 'drafts',
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
        dictionary: {},

        /** 
         * A list of users returned from /users/query.  We need to use a list
         * here, because we need to preserve the order returned from the
         * backend.  The query can include a `sort` parameter.  We can only run
         * one query at a time, subsequent queries will be assumed to build on
         * it. If you need to start a new query, call the `newQuery` action.
         */
        query: []
    },
    reducers: {
        /**
         * Reset the query, so that you can run a new one.
         *
         * @param {Object} state - The redux state slice.
         * @param {Object} action - The redux action we're reducing.
         */
        newQuery: function(state, action) {
            state.query = []
        },

        // ========== GET /user/:user_id/drafts/query?... ====================================

        /**
         * The GET request to /drafts/query?... succeeded.  We need to process the drafts into
         * both the dictionary and the query list.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - the redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action. 
         * @param {object} action.payload.requestId - A uuid for the request we're completing.
         * @param {object[]} action.payload.drafts - An array of populated draft objects.
         */
        completeQueryDraftsRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            if ( action.payload.result.length > 0 ) {
                for(const paper of action.payload.result) {
                    state.dictionary[paper.id] = paper 
                    state.query.push(paper)
                }
            }
        },

        // ========== GET /user/:user_id/drafts ==============================================

        /**
         * The GET request to /user/:user_id/drafts succeeded.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.drafts - An array of populated draft objects
         */
        completeGetDraftsRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            for ( const paper of action.payload.result ) {
                state.dictionary[paper.id] = paper 
            }
        },

        // ========== DELETE /user/:user_id/draft/:id =================

        /**
         * Finish the DELETE /draft/:user_id call.  In this case, the call returns
         * the id of the deleted draft and we need to delete them from state on
         * our side.  
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.draftId - The id of the deleted draft
         */
        completeDeleteDraftsRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
            delete state.dictionary[action.payload.result]
        },

        // ========== Generic Request Methods =============
        // Use these methods when no extra logic is needed.  If additional
        // logic is needed for a particular request, make a reducer of the form
        // [make/fail/complete/cleanup][method][endpoint]Request().  For
        // example, makePostDraftRequest().  The reducer should take an object
        // with at least requestId defined, along with whatever all inputs it
        // needs.

        /**
         * Make a request to a draft or drafts endpoint.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {string} action.payload.method - One of the HTTP verbs
         * @param {string} action.payload.endpoint - The endpoint we're making the request to
         */
        makeRequest: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker(action.payload.method, action.payload.endpoint)
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Fail a request to a draft or drafts endpoint, usually with an error.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {int} action.payload.status - (Optional) The status code returned with the response.
         * @param {string} action.payload.error - (Optional) A string error message.
         */
        failRequest: function(state, action) {
            RequestTracker.failRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Complete a request to a draft or drafts endpoint by setting the draft
         * sent back by the backend in the drafts hash.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.draft - A populated draft object, must have `id` defined
         */
        completeRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            const paper = action.payload.result
            state.dictionary[paper.id] = paper 

        },

        /**
         * Cleanup a request by removing it from our request hash.  Once we're
         * done with a request, we don't need to keep its tracking around.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         */
        cleanupRequest: function(state, action) {
            delete state.requests[action.payload.requestId]
        }
    }
})


/**
 * GET /user/:id/drafts
 *
 * Get all drafts in the database for the provided user.  Populates state.dictionary.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getDrafts = function(userId) {
    return function(dispatch, getState) {
        const requestId = uuidv4() 
        const endpoint = `/user/${userId}/drafts`

        let payload = {
            requestId: requestId
        }


        dispatch(usersSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(drafts) {
            payload.result = drafts 
            dispatch(usersSlice.actions.completeGetDraftsRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(usersSlice.actions.failRequest(payload))
        })

        return requestId
    }
}


export const { newQuery, completeQueryDraftsRequest, completeGetDraftsRequest, completeDeleteDraftsRequest, makeRequest, failRequest, completeRequest, cleanupRequest }  = usersSlice.actions

export default usersSlice.reducer
