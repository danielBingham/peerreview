import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import setRelationsInState from './helpers/relations'

import {
    setInDictionary,
    removeEntity,
    makeQuery,
    setQueryResults,
    clearQuery,
    clearQueries
} from './helpers/state'

import { 
    makeSearchParams,
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    bustRequestCache,
    useRequest as useTrackedRequest,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

const cacheTTL = 5 * 1000 // 5 seconds 

export const journalSubmissionsSlice = createSlice({
    name: 'journalSubmissions',
    initialState: {
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of recent requests keyed by method-endpoint to allow us
         * to determine whether we've made a certain request recently.
         *
         * @type {object}
         */
        requestCache: {},

        /**
         * A dictionary of journalSubmissions we've retrieved from the backend, keyed by
         * journalSubmission.id.
         *
         * Will be updated when a POST, PATCH, or DELETE is called.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In this case: GET /users 
         *
         * Structure:
         * {
         *  queryName: {
         *      meta: {
         *          page: <int>,
         *          count: <int>,
         *          pageSize: <int>,
         *          numberOfPages: <int>
         *      },
         *      list: [] 
         *  },
         *  ...
         * }
         */
        queries: {}

    },
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setJournalSubmissionsInDictionary: setInDictionary,
        removeJournalSubmission: removeEntity,
        makeJournalSubmissionQuery: makeQuery,
        setJournalSubmissionQueryResults: setQueryResults,
        clearJournalSubmissionQuery: clearQuery,
        clearJournalSubmissionQueries: clearQueries,

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useTrackedRequest,
        bustRequestCache: bustRequestCache,
        cleanupRequest: function(state, action) {
            action.payload.cacheTTL = cacheTTL
            cleanupTrackedRequest(state, action)
        }, 
        garbageCollectRequests: function(state, action) {
            action.payload = cacheTTL
            garbageCollectTrackedRequests(state, action)
        }
    }
})



/**
 * GET /journal/:journalId/submissions
 *
 * Get all journalSubmissions in the database.  Populates state.dictionary and state.list.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} journalId   The id of the Journal we want to retrieve submissions for.
 * @param {Object} params   An object containing query parameters.
 * @param {boolean} replaceList If true, the results will replace the current
 * list.  Otherwise they will be appended to it.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getJournalSubmissions = function(name, journalId, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = `/journal/${journalId}/submissions` + ( params ? '?' + queryString.toString() : '')

        dispatch(journalSubmissionsSlice.actions.makeJournalSubmissionQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, journalSubmissionsSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(journalSubmissionsSlice.actions.setJournalSubmissionsInDictionary({ dictionary: response.dictionary}))

                dispatch(journalSubmissionsSlice.actions.setJournalSubmissionQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * POST /journal/:journalId/submissions
 *
 * Create a new JournalSubmission.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int}     journalId   The id of the Journal we want to create a new submission for.
 * @param {object}  journalSubmission - A populated JournalSubmission object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postJournalSubmissions = function(journalId, journalSubmission) {
    return function(dispatch, getState) {
        dispatch(journalSubmissionsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalSubmissionsSlice,
            'POST', `/journal/${journalId}/submissions`, journalSubmission,
            function(response) {
                dispatch(journalSubmissionsSlice.actions.setJournalSubmissionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * GET /journal/:journalId/submission/:id
 *
 * Get a single JournalSubmission.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the journalSubmission we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getJournalSubmission = function(journalId, id) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, journalSubmissionsSlice,
            'GET', `/journal/${journalId}/submission/${id}`, null,
            function(response) {
                dispatch(journalSubmissionsSlice.actions.setJournalSubmissionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /journal/:journalId/submission/:id
 *
 * Update a JournalSubmission from a partial `JournalSubmission` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int}     journalId   The id of the journal the submission belongs to.
 * @param {object}  journalSubmission - A populated journalSubmission object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchJournalSubmission = function(journalId, journalSubmission) {
    return function(dispatch, getState) {
        dispatch(journalSubmissionsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalSubmissionsSlice,
            'PATCH', `/journal/${journalId}/submission/${journalSubmission.id}`, journalSubmission,
            function(response) {
                dispatch(journalSubmissionsSlice.actions.setJournalSubmissionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /journal/:journalId/submission/:id
 *
 * Delete a journalSubmission. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param   {int}   journalId   The id of the journal the submission we want to delete belongs to.
 * @param   {int}   id  The id of the submission we want to delete.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteJournalSubmission = function(journalId, id) {
    return function(dispatch, getState) {
        dispatch(journalSubmissionsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalSubmissionsSlice,
            'DELETE', `/journal/${journalId}/submission/${id}`, null,
            function(response) {
                dispatch(journalSubmissionsSlice.actions.removeJournalSubmission({ entity: response.entity }))
            }
        )
    }
} 

/**
 * POST /journal/:journalId/submission/:id/reviewers
 *
 * Assign a reviewer to a journal submission.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param   {int}   journalId   The id of the journal the submission we want to delete belongs to.
 * @param   {int}   submissionId  The id of the submission we want to delete.
 * @param   {int}   userId      The id of the user we want to assign as a reviewer.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postJournalSubmissionReviewers = function(journalId, submissionId, assignee) {
    return function(dispatch, getState) {
        dispatch(journalSubmissionsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalSubmissionsSlice,
            'POST', `/journal/${journalId}/submission/${submissionId}/reviewers`, assignee,
            function(response) {
                dispatch(journalSubmissionsSlice.actions.setJournalSubmissionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
} 

/**
 * DELETE /journal/:journalId/submission/:id/reviewer/:userId
 *
 * Unassign a reviewer from a journal submission.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param   {int}   journalId   The id of the journal the submission we want to delete belongs to.
 * @param   {int}   submissionId  The id of the submission we want to delete.
 * @param   {int}   userId      The id of the user we want to assign as a reviewer.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteJournalSubmissionReviewer = function(journalId, submissionId, userId) {
    return function(dispatch, getState) {
        dispatch(journalSubmissionsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalSubmissionsSlice,
            'DELETE', `/journal/${journalId}/submission/${submissionId}/reviewer/${userId}`, null,
            function(response) {
                dispatch(journalSubmissionsSlice.actions.setJournalSubmissionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
} 

/**
 * POST /journal/:journalId/submission/:id/editors
 *
 * Assign an editor to a journal submission.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param   {int}   journalId   The id of the journal the submission we want to delete belongs to.
 * @param   {int}   submissionId  The id of the submission we want to delete.
 * @param   {int}   userId      The id of the user we want to assign as a reviewer.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postJournalSubmissionEditors = function(journalId, submissionId, assignee) {
    return function(dispatch, getState) {
        dispatch(journalSubmissionsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalSubmissionsSlice,
            'POST', `/journal/${journalId}/submission/${submissionId}/editors`, assignee,
            function(response) {
                dispatch(journalSubmissionsSlice.actions.setJournalSubmissionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
} 

/**
 * DELETE /journal/:journalId/submission/:id/editor/:userId
 *
 * Unassign a editor from a journal submission.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param   {int}   journalId   The id of the journal the submission we want to delete belongs to.
 * @param   {int}   submissionId  The id of the submission we want to delete.
 * @param   {int}   userId      The id of the user we want to assign as a reviewer.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteJournalSubmissionEditor = function(journalId, submissionId, userId) {
    return function(dispatch, getState) {
        dispatch(journalSubmissionsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalSubmissionsSlice,
            'DELETE', `/journal/${journalId}/submission/${submissionId}/editor/${userId}`, null,
            function(response) {
                dispatch(journalSubmissionsSlice.actions.setJournalSubmissionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
} 
export const {  
    setJournalSubmissionsInDictionary, removeJournalSubmission, 
    makeJournalSubmissionQuery, setJournalSubmissionQueryResults, clearJournalSubmissionQuery,
    cleanupRequest   
}  = journalSubmissionsSlice.actions

export default journalSubmissionsSlice.reducer
