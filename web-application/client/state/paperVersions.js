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

// ================ Reducer Helpers ===========================================

function setMostRecentVersion(state, version) {
    const mostRecentVersion = (version.paperId in state.mostRecentVersion) ? state.dictionary[state.mostRecentVersion[version.paperId]] : null
    if ( ! mostRecentVersion   
        || version.createdDate > mostRecentVersion.createdDate) 
    {
        state.mostRecentVersion[version.paperId] = version.id
    }
}

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
         * A dictionary of paperVersions keyed by paperVersion.id.
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

        /**
         * The most recent version of each paper, keyed by paperID.
         */
        mostRecentVersion: {},

        /**
         * A map containing the versions belonging to each paper.
         */
        versionsByPaper: {},
        
        /**
         * Loaded paper files. 
         */
        files: {},

    },
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setPaperVersionsInDictionary: function(state, action) {
            setInDictionary(state, action)

            if("dictionary" in action.payload) {
                for(const [id, version] of Object.entries(action.payload.dictionary)) {
                    setMostRecentVersion(state, version)
                    if ( ! ( version.paperId in state.versionsByPaper) ) {
                        state.versionsByPaper[version.paperId] = {}
                    }
                    state.versionsByPaper[version.paperId][version.id] = version
                }
            } else if ( "entity" in action.payload ) {
                setMostRecentVersion(state, action.payload.entity)

                if ( ! ( action.payload.entity.paperId in state.versionsByPaper) ) {
                    state.versionsByPaper[action.payload.entity.paperId] = {}
                }
                state.versionsByPaper[action.payload.entity.paperId][action.payload.entity.id] = action.payload.entity
            }
        },
        removePaperVersion: function(state, action) {
            removeEntity(state, action)

            if ( state.mostRecentVersion[entity.paperId] == entity.id) {
                delete state.mostRecentVersion[entity.paperId]

                for(const [id, version] of Object.entries(state.versionsByPaper[entity.paperId])) {
                    setMostRecentVersion(state, state.dictionary[id])
                }
            }
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
        },

        // ======== Specific State ============================================

        setFile: function(state, action) { 
            state.files[action.payload.id] = action.payload.url
        },

        clearFiles: function(state, action) {
            if ( state.files[action.payload.id] ) {
                URL.revokeObjectURL(state.files[action.payload.id])
                delete state.files[action.payload.id]
            }
        },
    }
})


export const loadFiles = function(paperId) {
    return function(dispatch, getState) {
        const state = getState()
        
        for(const [id, version] of Object.entries(state.paperVersions.versionsByPaper[paperId])) {
            const url = new URL(version.file.filepath, version.file.location)
            const urlString = url.toString()

            fetch(urlString)
                .then(response => response.blob())
                .then(blob => dispatch(paperVersionsSlice.actions.setFile({ id: id, url: URL.createObjectURL(blob) })))
        }
    }
}

export const clearFiles  = function(paperId) {
    return function(dispatch, getState) {
        const state = getState()

        for(const [id, version] of Object.entries(state.paperVersions.versionsByPaper[paperId])) {
            dispatch(paperVersionsSlice.actions.clearFiles({ id: id }))
        }
    }
}

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
export const getPaperVersion = function(paperId, id) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, paperVersionsSlice,
            'GET', `/paper/${paperId}/version/${id}`, null,
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
            'PATCH', `/paper/${paperId}/version/${paperVersion.id}`, paperVersion,
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
