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

export const journalsSlice = createSlice({
    name: 'journals',
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
         * A dictionary of journals we've retrieved from the backend, keyed by
         * journal.id.
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
         * In this case: GET /journals
         *
         * NOTE: Will **NOT** be updated when a POST, PATCH, or DELETE is called.
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
        
        setJournalsInDictionary: setInDictionary,
        removeJournal: removeEntity,
        makeJournalQuery: makeQuery,
        setJournalQueryResults: setQueryResults,
        clearJournalQuery: clearQuery,
        clearJournalQueries: clearQueries,

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
 * GET /journals
 *
 * Get all journals in the database.  Populates state.journals.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getJournals = function(name, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = '/journals' + ( params ? '?' + queryString.toString() : '')

        dispatch(journalsSlice.actions.makeJournalQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(journalsSlice.actions.setJournalsInDictionary({ dictionary: response.dictionary }))

                dispatch(journalsSlice.actions.setJournalQueryResults({
                    name: name,
                    meta: response.meta,
                    list: response.list 
                }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * POST /journals
 *
 * Create a new journal.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} journal - A populated journal object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postJournals = function(journal) {
    return function(dispatch, getState) {
        dispatch(journalsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'POST', '/journals', journal,
            function(response) {
                dispatch(journalsSlice.actions.setJournalsInDictionary({ entity: response.entity }))
                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * GET /journal/:id
 *
 * Get a single journal.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the journal we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getJournal = function(id, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = `/journal/${id}` + ( params ? '?' + queryString.toString() : '')

        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(journalsSlice.actions.setJournalsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PUT /journal/:id
 *
 * Replace a journal wholesale. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} journal - A populated journal object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const putJournal = function(journal) {
    return function(dispatch, getState) {
        dispatch(journalsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'PUT', `/journal/${journal.id}`, journal,
            function(response) {
                dispatch(journalsSlice.actions.setJournalsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /journal/:id
 *
 * Update a journal from a partial `journal` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} journal - A populate journal object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchJournal = function(journal) {
    return function(dispatch, getState) {
        dispatch(journalsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'PATCH', `/journal/${journal.id}`, journal,
            function(response) {
                dispatch(journalsSlice.actions.setJournalsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /journal/:id
 *
 * Delete a journal. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param   {int}   id  The id of the Journal we want to delete.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteJournal = function(id) {
    return function(dispatch, getState) {
        dispatch(journalsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'DELETE', `/journal/${id}`, null,
            function(response) {
                dispatch(journalsSlice.actions.removeJournal({ entity: response.entity }))

                dispatch(journalsSlice.actions.clearJournalQueries())
            }
        )
    }
} 

/**
 * POST /journal/:journalId/members
 *
 * Add a member to a journal.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} journal - A populate journal object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postJournalMembers = function(journalId, member) {
    return function(dispatch, getState) {
        dispatch(journalsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'POST', `/journal/${journalId}/members`, member,
            function(response) {
                dispatch(journalsSlice.actions.setJournalsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /journal/:journalId/member/:userId
 *
 * Modify a journal member.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} journal - A populate journal object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchJournalMember = function(journalId, member) {
    return function(dispatch, getState) {
        dispatch(journalsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'PATCH', `/journal/${journalId}/member/${member.userId}`, member,
            function(response) {
                dispatch(journalsSlice.actions.setJournalsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /journal/:journalId/member/:userId
 *
 * Remove a member from a journal.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} journal - A populate journal object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteJournalMember = function(journalId, userId) {
    return function(dispatch, getState) {
        dispatch(journalsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'DELETE', `/journal/${journalId}/member/${userId}`, null,
            function(response) {
                dispatch(journalsSlice.actions.setJournalsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

export const {  
    setJournalsInDictionary, removeJournal, 
    makeJournalQuery, setJournalQueryResults, clearJournalQuery, 
    cleanupRequest   
}  = journalsSlice.actions

export default journalsSlice.reducer
