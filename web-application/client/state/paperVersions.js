import { createSlice } from '@reduxjs/toolkit'

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

export const paperVersionsSlice = createSlice({
    name: 'paperVersions',
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
         * A dictionary of papers we've retrieved from the backend, keyed by
         * paper.id.
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
        queries: {}
    },
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setPaperVersionsInDictionary: function(state, action) {
            if ( action.payload.dictionary ) {
                state.dictionary = { ...state.dictionary, ...action.payload.dictionary }
            } else if( action.payload.entity ) {
                const entity = action.payload.entity
                if ( entity.paperId in state.dictionary ) {
                    state.dictionary[entity.paperId] = {} 
                }
                state.dictionary[entity.paperId][entity.version] = entity 
            } else {
                console.log(action)
                throw new Error(`Invalid payload sent to ${action.type}.`)
            }
        },
        removePaperVersion: function(state, action) {
            const entity = action.payload.entity
            delete state.dictionary[entity.paperId][entity.version]
        },
        makePaperVersionQuery: makeQuery,
        setPaperVersionQueryResults: setQueryResults,
        clearPaperVersionQuery: clearQuery,
        clearPaperVersionQueries: clearQueries,


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
 * GET /papers/:paperId/verions
 *
 * Get all PaperVersions for Paper in the database.  Populates state.papers.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getPaperVersions = function(paperId, name, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = `/paper/${paperId}/versions` + ( params ? '?' + queryString.toString() : '')

        dispatch(paperVersionsSlice.actions.makePaperVersionQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, paperVersionsSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(paperVersionsSlice.actions.setPaperVersionsInDictionary({ dictionary: response.dictionary}))

                dispatch(paperVersionsSlice.actions.setPaperVersionQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * POST /papers/:paperId/versions
 *
 * Create a new PaperVersion.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paperVersion - A populated PaperVersion object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postPaperVersions = function(paperId, paperVersion) {
    return function(dispatch, getState) {
        dispatch(paperVersionsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, paperVersionsSlice,
            'POST', `/paper/${paperId}/versions`, paperVersion,
            function(response) {
                dispatch(paperVersionsSlice.actions.setPaperVersionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * GET /paper/:paperId/version/:version
 *
 * Get a single PaperVersion.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the PaperVersion we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getPaperVersion = function(paperId, versionNumber) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, paperVersionsSlice,
            'GET', `/paper/${paperId}/version/${versionNumber}`, null,
            function(response) {
                dispatch(paperVersionsSlice.actions.setPaperVersionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /paper/:paperId/version/:version
 *
 * Update a PaperVersion from a partial `PaperVersion` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paperVersion - A populated PaperVersion object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchPaperVersion = function(paperId, paperVersion) {
    return function(dispatch, getState) {
        dispatch(paperVersionsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, paperVersionsSlice,
            'PATCH', `/paper/${paperId}/version/${paperVersion.version}`, paperVersion,
            function(response) {
                dispatch(paperVersionsSlice.actions.setPaperVersionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

export const {  
    setPaperVersionsInDictionary, removePaperVersion,
    makePaperVersionQuery, setPaperVersionQueryResults, clearPaperVersionQuery,
    cleanupRequest   
}  = paperVersionsSlice.actions

export default paperVersionsSlice.reducer
