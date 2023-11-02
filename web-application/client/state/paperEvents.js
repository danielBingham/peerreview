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

            // TECHDEBT - We need to filter the list for the ids being appended
            // because when a PaperComment goes from 'in-progress' to
            // 'committed', we update the `eventDate` of its attached event.
            // This can result in duplicate events in the list. The solution is
            // to filter the list for any of the ids we're about to append, to
            // remove them from their previous locations in the list and ensure
            // the appended instances of those ids are the only instances.
            //
            // There almost certainly is a better way to do this.
            //
            // O(n^2) -- We shouldn't often have lits of ids long enough for
            // that to matter, since we're getting only the newest events, but
            // this is still far from ideal.
            //
            //
            let clearedList = [ ...state.queries[name].list ]
            for(const id of list) {
                clearedList = clearedList.filter((item) => item != id)
            }

            state.queries[name].list = [ ...clearedList, ...list ]
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

/**
 * GET /feed/editor
 *
 * Get events for the current user's editor feed.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getEditorFeed = function(name, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = `/feed/editor${( params ? '?' + queryString.toString() : '')}`

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




export const {  
    setPaperEventsInDictionary, removePaperEvent,
    makePaperEventQuery, setPaperEventQueryResults, clearPaperEventQuery,
    cleanupRequest   
}  = eventsSlice.actions

export default eventsSlice.reducer
