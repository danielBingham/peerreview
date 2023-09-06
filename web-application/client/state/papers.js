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

export const papersSlice = createSlice({
    name: 'papers',
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
        queries: {},

        // ======== Specific State ============================================

        /**
         * The draft paper the current user is assembling.  It hasn't been
         * submitted to the backend yet.
         */
        draft: null 
    },
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setPapersInDictionary: setInDictionary,
        removePaper: removeEntity,
        makePaperQuery: makeQuery,
        setPaperQueryResults: setQueryResults,
        clearPaperQuery: clearQuery,
        clearPaperQueries: clearQueries,

        // ======== Paper Specific State Manipulation =========================
        
        addVoteToPaper: function(state, action) {
            // Add the vote to the dictionary
            const vote = action.payload
            if ( state.dictionary[vote.paperId] ) {
                state.dictionary[vote.paperId].votes.push(vote)
            }

            // Add the vote to the list.
            const paper = state.list.find((p) => p.id == vote.paperId)
            if ( paper ) {
                paper.votes.push(vote)
            }
        },

        setSubmissionsOnPaper: function(state, action) {
            const paperId = action.payload.paperId
            const submissions = action.payload.submissions

            if ( state.dictionary[paperId] ) {
                state.dictionary[paperId].submissions = submissions
            }
        },

        updateSubmissionOnPaper: function(state, action) {
            const paperId = action.payload.paperId
            const submission = action.payload.submission

            if ( state.dictionary[paperId] ) {
                const index = state.dictionary[paperId].submissions.findIndex((s) => s.id == submission.id)
                state.dictionary[paperId].submissions[index] = submission
            }
        },

        setDraft: function(state, action) {
            state.draft = action.payload   
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
 * GET /papers
 *
 * Get all papers in the database.  Populates state.papers.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getPapers = function(name, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = '/papers' + ( params ? '?' + queryString.toString() : '')

        dispatch(papersSlice.actions.makePaperQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, papersSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(papersSlice.actions.setPapersInDictionary({ dictionary: response.dictionary}))

                dispatch(papersSlice.actions.setPaperQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * POST /papers
 *
 * Create a new paper.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paper - A populated paper object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postPapers = function(paper) {
    return function(dispatch, getState) {
        dispatch(papersSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'POST', '/papers', paper,
            function(response) {
                dispatch(papersSlice.actions.setPapersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * GET /paper/:id
 *
 * Get a single paper.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the paper we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getPaper = function(id) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'GET', `/paper/${id}`, null,
            function(response) {
                dispatch(papersSlice.actions.setPapersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PUT /paper/:id
 *
 * Replace a paper wholesale. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paper - A populated paper object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const putPaper = function(paper) {
    return function(dispatch, getState) {
        dispatch(papersSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'PUT', `/paper/${paper.id}`, paper,
            function(response) {
                dispatch(papersSlice.actions.setPapersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /paper/:id
 *
 * Update a paper from a partial `paper` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paper - A populate paper object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchPaper = function(paper) {
    return function(dispatch, getState) {
        dispatch(papersSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'PATCH', `/paper/${paper.id}`, paper,
            function(response) {
                dispatch(papersSlice.actions.setPapersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /paper/:id
 *
 * Delete a paper. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paper - A populated paper object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deletePaper = function(paper) {
    return function(dispatch, getState) {
        const endpoint = '/paper/' + paper.id

        dispatch(papersSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'DELETE', `/paper/${paper.id}`, null,
            function(response) {
                dispatch(papersSlice.actions.removePaper({ entity: response.entity.id }))
            }
        )
    }
} 


/**
 * POST /paper/:id/versions
 *
 * Create a new version of a paper.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paper    A populated paper object.
 * @param {object} version  A populate paper version object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postPaperVersions = function(paper, version) {
    return function(dispatch, getState) {
        dispatch(papersSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'POST', `/paper/${paper.id}/versions`, version,
            function(response) {
                dispatch(papersSlice.actions.setPapersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /paper/:id/versions
 *
 * Create a new version of a paper.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paper    A populated paper object.
 * @param {object} version  A populated paper version object. 
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchPaperVersion = function(paper, version) {
    return function(dispatch, getState) {
        dispatch(papersSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'PATCH', `/paper/${paper.id}/version/${version.version}`, version,
            function(response) {
                dispatch(papersSlice.actions.setPapersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

export const getPaperSubmissions = function(paperId) {
    return function(dispatch, getState) {
        dispatch(papersSlice.actions.bustRequestCache())

        return makeTrackedRequest(dispatch, getState, papersSlice,
            'GET', `/paper/${paperId}/submissions`, null,
            function(results) {
                dispatch(papersSlice.actions.setSubmissionsOnPaper({ paperId: paperId, submissions: results}))
            }
        )
    }
}

export const {  
    setPapersInDictionary, removePaper,
    makePaperQuery, setPaperQueryResults, clearPaperQuery,
    setSubmissionsOnPaper, updateSubmissionOnPaper, setDraft, 
    cleanupRequest   
}  = papersSlice.actions

export default papersSlice.reducer
