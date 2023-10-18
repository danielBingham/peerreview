import { createSlice } from '@reduxjs/toolkit'

import logger from '../logger'

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
    makeTrackedRequest,
    makeSearchParams,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    bustRequestCache,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

export const paperCommentsSlice = createSlice({
    name: 'paperComments',
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
         * A dictionary of paperComments we've retrieved from the backend keyed by
         * paperComment.id.
         *
         * @type {object}
         */
        dictionary: {}

        // ======== Specific State ============================================

    },
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setPaperCommentsInDictionary: setInDictionary,
        removePaperComment: removeEntity,

        // ======== PaperComment Specific State Manipulation =========================


        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess, 
        useRequest: useRequest,
        bustRequestCache: bustRequestCache,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})

/**
 * Start a new paperComment.
*/
export const newPaperComment = function(paperId, userId) {
    return function(dispatch, getState) {
        const paperComment = {
            paperId: paperId,
            userId: userId,
            status: 'in-progress',
            content: '' 
        }
        return dispatch(postPaperComments(paperComment))
    }
}

export const updatePaperComment = function(paperComment) {
    return function(dispatch, getState) {
        const state = getState()
        
        const existing = state.paperComments.dictionary[paperComment.id]
        const newComment = { ...existing, ...paperComment }
        dispatch(paperCommentsSlice.actions.setPaperCommentsInDictionary({ entity: newComment }))

        return dispatch(patchPaperComment(newComment.paperId, paperComment))
    }
}

/**
 * POST /paperComments
 *
 * Create a new paperComment.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paperComment - A populated paperComment object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postPaperComments = function(paperComment) {
    return function(dispatch, getState) {

        dispatch(paperCommentsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, paperCommentsSlice,
            'POST', `/paper/${paperComment.paperId}/comments`, paperComment,
            function(response) {
                dispatch(paperCommentsSlice.actions.setPaperCommentsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /paper/:paperId/comment/:id
 *
 * Update a paperComment from a partial `paperComment` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paperComment - A populate paperComment object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchPaperComment = function(paperId, paperComment) {
    return function(dispatch, getState) {
        dispatch(paperCommentsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, paperCommentsSlice,
            'PATCH', `/paper/${paperId}/comment/${paperComment.id}`, paperComment,
            function(response) {
                dispatch(paperCommentsSlice.actions.setPaperCommentsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /paperComment/:id
 *
 * Delete a paperComment. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paperComment - A populated paperComment object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deletePaperComment = function(id) {
    return function(dispatch, getState) {
        const state = getState()
        const paperComment = state.paperComments.dictionary[id]
        dispatch(paperCommentsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, paperCommentsSlice,
            'DELETE', `/paper/${paperComment.paperId}/comment/${paperComment.id}`, null,
            function(response) {
                dispatch(paperCommentsSlice.actions.removePaperComment({ entity: paperComment }))
            }
        )
    }
} 


export const {  
    setPaperCommentsInDictionary,
    cleanupRequest 
}  = paperCommentsSlice.actions

export default paperCommentsSlice.reducer
