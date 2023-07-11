import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import logger from '../logger'

import { addFieldsToDictionary } from './fields'
import { addUsersToDictionary } from './users'

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
         * @type {object}
         */
        dictionary: {},

        /**
         * A list of journals retrieved from the GET /journals endpoint, or added
         * with appendJournalsToList, preserving order.
         *
         * @type {object[]}
         */
        list: []

    },
    reducers: {

        /**
         * Add one or more journals to the state dictionary.  
         *
         * Does NOT add them to the list.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object[] | object} action.payload - The journals we want to add.  Can
         * either be an array of journals or a single journal object.
         */
        addJournalsToDictionary: function(state, action) {
            if ( action.payload && action.payload.length ) {
                for( const journal of action.payload) {
                    state.dictionary[journal.id] = journal
                }
            } else {
                state.dictionary[action.payload.id] = action.payload
            }
        },

        /**
         * Append one or more journals to the list.
         *
         * DOES add to them to the dictionary as well.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object[] | object} action.payload - The journals we want to
         * add.  Can be either an array of journals or a single journal.
         */
        appendJournalsToList: function(state, action) {
            if ( action.payload && action.payload.length ) {
                for (const journal of action.payload) {
                    state.list.push(journal)
                    state.dictionary[journal.id] = journal
                }
            } else {
                state.list.push(action.payload)
                state.dictionary[action.payload.id] = action.payload
            }
        },

        /**
         * Remove journals from the dictionary and the list.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object[] | object} action.payload - An array of journals or a
         * single journal that we'd like to remove.
         */
        removeJournals: function(state, action) {
            if ( action.payload && action.payload.length ) {
                for(const journal of action.payload ) {
                    delete state.dictionary[journal.id]
                    state.list = state.list.filter((p) => p.id !== journal.id)
                }
            } else {
                delete state.dictionary[action.payload.id]
                state.list = state.list.filter((p) => p.id !== action.payload.id)
            }
        },

        /**
         * Clear the list, as when you want to start a new ordered query.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         */
        clearList: function(state, action) {
            state.list = []
        },

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
export const getJournals = function(params, replaceList) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = '/journals' + ( params ? '?' + queryString.toString() : '')

        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'GET', endpoint, null,
            function(journals) {
                if ( replaceList ) {
                    dispatch(journalsSlice.actions.clearList())
                }

                if ( journals && journals.length ) {
                    dispatch(journalsSlice.actions.appendJournalsToList(journals))
                } 
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
            function(returnedJournal) {
                dispatch(journalsSlice.actions.addJournalsToDictionary(returnedJournal))
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
export const getJournal = function(id) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'GET', `/journal/${id}`, null,
            function(journal) {
                dispatch(journalsSlice.actions.addJournalsToDictionary(journal))
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
            function(returnedJournal) {
                dispatch(journalsSlice.actions.addJournalsToDictionary(returnedJournal))
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
            function(returnedJournal) {
                dispatch(journalsSlice.actions.addJournalsToDictionary(returnedJournal))
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
 * @param {object} journal - A populated journal object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteJournal = function(journal) {
    return function(dispatch, getState) {
        const endpoint = '/journal/' + journal.id

        dispatch(journalsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, journalsSlice,
            'DELETE', `/journal/${journal.id}`, null,
            function(response) {
                dispatch(journalsSlice.actions.removeJournals(journal))
            }
        )
    }
} 



export const {  addJournalsToDictionary, appendJournalsToList, removeJournals, clearList, cleanupRequest   }  = journalsSlice.actions

export default journalsSlice.reducer
