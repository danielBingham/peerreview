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

const cacheTTL = 0  // Don't cache paper events.  We poll for them. 

export const eventsSlice = createSlice({
    name: 'paperEvents',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of events we've retrieved from the backend, keyed by
         * event.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
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
        queries: {},

        // ======== Specific State ============================================

    },
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setPaperEventsInDictionary: setInDictionary,
        removePaperEvent: removeEntity,
        makePaperEventQuery: makeQuery,
        setPaperEventQueryResults: setQueryResults,
        clearPaperEventQuery: clearQuery,
        clearPaperEventQueries: clearQueries,

        // ======== State Specific Manipulation Helpers ====

        appendToQuery: function(state, action) {
            const name = action.payload.name
            const list = action.payload.list

            state.queries[name].list = [ ...state.queries[name].list, ...list ]
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
 * GET /paper/:paperId/events
 *
 * Get all events in the database.  Populates state.events.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getPaperEvents = function(name, paperId, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = `/paper/${paperId}/events${( params ? '?' + queryString.toString() : '')}`

        const state = getState()
        if ( ! state.paperEvents.queries[name] ) {
            dispatch(eventsSlice.actions.makePaperEventQuery({ name: name }))
        }

        return makeTrackedRequest(dispatch, getState, eventsSlice,
            'GET', endpoint, null,
            function(response) {
                if ( ! params?.since ) {
                    dispatch(eventsSlice.actions.setPaperEventsInDictionary({ dictionary: response.dictionary}))

                    dispatch(eventsSlice.actions.setPaperEventQueryResults({ name: name, meta: response.meta, list: response.list }))
                } else {
                    if ( response.list.length > 0 ) {
                        dispatch(eventsSlice.actions.setPaperEventsInDictionary({ dictionary: response.dictionary}))

                        dispatch(eventsSlice.actions.appendToQuery({ name: name, list: response.list }))
                    }
                }

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /paper/:paperId/event/:id
 *
 * Update a event from a partial `event` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} event - A populate event object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchPaperEvent = function(paperId, event) {
    return function(dispatch, getState) {
        dispatch(eventsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, eventsSlice,
            'PATCH', `/paper/${paperId}/event/${event.id}`, event,
            function(response) {
                dispatch(eventsSlice.actions.setPaperEventsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}




export const {  
    setPaperEventsInDictionary, removePaperEvent,
    makePaperEventQuery, setPaperEventQueryResults, clearPaperEventQuery,
    cleanupRequest   
}  = eventsSlice.actions

export default eventsSlice.reducer
