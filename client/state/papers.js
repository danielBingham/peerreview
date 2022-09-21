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
    useRequest as useTrackedRequest,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

const cacheTTL = 5 * 1000 // 5 seconds 

export const papersSlice = createSlice({
    name: 'papers',
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
         * A dictionary of papers we've retrieved from the backend, keyed by
         * paper.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         * A list of papers retrieved from the GET /papers endpoint, or added
         * with appendPapersToList, preserving order.
         *
         * @type {object[]}
         */
        list: [],

        /**
         * An object holding counts for the current list.
         */
        counts: { 
            count: 0,
            pageSize: 1,
            numberOfPages: 1
        },

        /**
         * The draft paper the current user is assembling.  It hasn't been
         * submitted to the backend yet.
         */
        draft: null 
    },
    reducers: {

        /**
         * Add one or more papers to the state dictionary.  
         *
         * Does NOT add them to the list.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object[] | object} action.payload - The papers we want to add.  Can
         * either be an array of papers or a single paper object.
         */
        addPapersToDictionary: function(state, action) {
            if ( action.payload && action.payload.length ) {
                for( const paper of action.payload) {
                    state.dictionary[paper.id] = paper
                }
            } else {
                state.dictionary[action.payload.id] = action.payload
            }
        },

        /**
         * Append one or more papers to the list.
         *
         * DOES add to them to the dictionary as well.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object[] | object} action.payload - The papers we want to
         * add.  Can be either an array of papers or a single paper.
         */
        appendPapersToList: function(state, action) {
            if ( action.payload && action.payload.length ) {
                for (const paper of action.payload) {
                    state.list.push(paper)
                    state.dictionary[paper.id] = paper
                }
            } else {
                state.list.push(action.payload)
                state.dictionary[action.payload.id] = action.payload
            }
        },

        /**
         * Remove papers from the dictionary and the list.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object[] | object} action.payload - An array of papers or a
         * single paper that we'd like to remove.
         */
        removePapers: function(state, action) {
            if ( action.payload && action.payload.length ) {
                for(const paper of action.payload ) {
                    delete state.dictionary[paper.id]
                    state.list = state.list.filter((p) => p.id !== paper.id)
                }
            } else {
                delete state.dictionary[action.payload.id]
                state.list = state.list.filter((p) => p.id !== action.payload.id)
            }
        },

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

        /**
         * Clear the list, as when you want to start a new ordered query.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         */
        clearList: function(state, action) {
            state.list = []
        },

        setCounts: function(state, action) {
            state.counts = action.payload
        },

        setDraft: function(state, action) {
            state.draft = action.payload   
        },

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useTrackedRequest,
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

//

/**
 * GET /papers/count
 *
 * Get all papers in the database.  Populates state.papers.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const countPapers = function(params, replaceList) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = '/papers/count' + ( params ? '?' + queryString.toString() : '')

        return makeTrackedRequest(dispatch, getState, papersSlice,
            'GET', endpoint, null,
            function(counts) {
                dispatch(papersSlice.actions.setCounts(counts))
            }
        )
    }
}


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
export const getPapers = function(params, replaceList) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = '/papers' + ( params ? '?' + queryString.toString() : '')

        return makeTrackedRequest(dispatch, getState, papersSlice,
            'GET', endpoint, null,
            function(papers) {
                if ( replaceList ) {
                    dispatch(papersSlice.actions.clearList())
                }

                if ( papers && papers.length ) {
                    for (const paper of papers) {
                        for (const author of paper.authors) {
                            dispatch(addUsersToDictionary(author.user))
                        }
                        dispatch(addFieldsToDictionary(paper.fields))
                    }
                    dispatch(papersSlice.actions.appendPapersToList(papers))
                } 
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
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'POST', '/papers', paper,
            function(returnedPaper) {
                dispatch(papersSlice.actions.addPapersToDictionary(returnedPaper))
                for (const author of paper.authors) {
                    dispatch(addUsersToDictionary(author.user))
                }
                dispatch(addFieldsToDictionary(paper.fields))
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
            function(paper) {
                for(const author of paper.authors) {
                    dispatch(addUsersToDictionary(author.user))
                }
                dispatch(addFieldsToDictionary(paper.fields))
                dispatch(papersSlice.actions.addPapersToDictionary(paper))
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
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'PUT', `/paper/${paper.id}`, paper,
            function(returnedPaper) {
                for(const author of returnedPaper.authors) {
                    dispatch(addUsersToDictionary(author.user))
                }
                dispatch(addFieldsToDictionary(returnedPaper.fields))
                dispatch(papersSlice.actions.addPapersToDictionary(returnedPaper))
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
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'PATCH', `/paper/${paper.id}`, paper,
            function(returnedPaper) {
                for(const author of returnedPaper.authors) {
                    dispatch(addUsersToDictionary(author.user))
                }
                dispatch(addFieldsToDictionary(returnedPaper.fields))
                dispatch(papersSlice.actions.addPapersToDictionary(returnedPaper))
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

        return makeTrackedRequest(dispatch, getState, papersSlice,
            'DELETE', `/paper/${paper.id}`, null,
            function(response) {
                dispatch(papersSlice.actions.removePapers(paper))
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
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'POST', `/paper/${paper.id}/versions`, version,
            function(returnedPaper) {
                for(const author of returnedPaper.authors) {
                    dispatch(addUsersToDictionary(author.user))
                }
                dispatch(addFieldsToDictionary(returnedPaper.fields))
                dispatch(papersSlice.actions.addPapersToDictionary(returnedPaper))
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
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'PATCH', `/paper/${paper.id}/version/${version.version}`, version,
            function(returnedPaper) {
                for(const author of returnedPaper.authors) {
                    dispatch(addUsersToDictionary(author.user))
                }
                dispatch(addFieldsToDictionary(returnedPaper.fields))
                dispatch(papersSlice.actions.addPapersToDictionary(returnedPaper))
            }
        )
    }
}


/**
 * POST /paper/:id/votes
 *
 * Add a vote to a paper.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} vote - A populated vote object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postVotes = function(vote) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, papersSlice,
            'POST', `/paper/${vote.paperId}/votes`, vote,
            function(returnedVote) {
                dispatch(papersSlice.actions.addVoteToPaper(returnedVote))
            }
        )
    }
}


export const {  addPapersToDictionary, appendPapersToList, removePapers, clearList, setDraft, cleanupRequest   }  = papersSlice.actions

export default papersSlice.reducer
