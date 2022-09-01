import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import logger from '../logger'

import { addFieldsToDictionary } from './fields'
import { addUsersToDictionary } from './users'
import { makeRequest as makeTrackedRequest, 
    failRequest as failTrackedRequest, 
    completeRequest as completeTrackedRequest, 
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
        }
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

        // ========== Request Tracking Methods =============

        makeRequest: makeTrackedRequest, 
        failRequest: failTrackedRequest, 
        completeRequest: completeTrackedRequest,
        useRequest: useTrackedRequest,
        cleanupRequest: function(state, action) {
            action.payload.cacheTTL = cacheTTL
            cleanupTrackedRequest(state, action)
        }, 
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})

//
const getRequestFromCache = function(method, endpoint) {
    return function(dispatch, getState) {
        const state = getState()
        for ( const id in state.papers.requests) {
            if ( state.papers.requests[id].method == method && state.papers.requests[id].endpoint == endpoint ) {
                dispatch(papersSlice.actions.useRequest({ requestId: id }))
                return state.papers.requests[id]
            }
        }
        return null
    }
}

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
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(papersSlice.actions.garbageCollectRequests(cacheTTL))

        const queryString = new URLSearchParams()
        for ( const key in params ) {
            if ( Array.isArray(params[key]) ) {
                for ( const value of params[key] ) {
                    queryString.append(key+'[]', value)
                }
            } else {
                queryString.append(key, params[key])
            }
        }

        const endpoint = '/papers/count' + ( params ? '?' + queryString.toString() : '')

        const request = dispatch(getRequestFromCache('GET', endpoint))
        if ( request ) {
            dispatch(papersSlice.actions.setCounts(request.result))
            return request.requestId
        }


        const requestId = uuidv4() 
        let payload = {
            requestId: requestId
        }

        dispatch(papersSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(counts) {
            dispatch(papersSlice.actions.setCounts(counts))

            payload.result = counts 
            dispatch(papersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(papersSlice.actions.failRequest(payload))
        })

        return requestId
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
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(papersSlice.actions.garbageCollectRequests(cacheTTL))

        const queryString = new URLSearchParams()
        for ( const key in params ) {
            if ( Array.isArray(params[key]) ) {
                for ( const value of params[key] ) {
                    queryString.append(key+'[]', value)
                }
            } else {
                queryString.append(key, params[key])
            }
        }

        const endpoint = '/papers' + ( params ? '?' + queryString.toString() : '')

        const request = dispatch(getRequestFromCache('GET', endpoint))
        if ( request ) {
            if ( replaceList ) {
                dispatch(papersSlice.actions.clearList())

                if ( request.result && request.result.length > 0) {
                    const state = getState()

                    // Update the entries in the list from the dictionary,
                    // because the papers in the dictionary are going to be the
                    // most up to date.
                    const list = [ ...request.result ]
                    for(const [index, paper] of list.entries()) {
                        if ( state.papers.dictionary[paper.id] ) {
                            list[index] = state.papers.dictionary[paper.id]
                        }
                    }
                    dispatch(papersSlice.actions.appendPapersToList(list))
                }
            }
            return request.requestId
        }


        const requestId = uuidv4() 
        let payload = {
            requestId: requestId
        }

        dispatch(papersSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(papers) {
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

            payload.result = papers
            dispatch(papersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(papersSlice.actions.failRequest(payload))
        })

        return requestId
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
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(papersSlice.actions.garbageCollectRequests(cacheTTL))

        const endpoint = '/papers'

        const requestId = uuidv4()
        const payload = {
            requestId: requestId
        }

        dispatch(papersSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paper)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedPaper) {
            dispatch(papersSlice.actions.addPapersToDictionary(returnedPaper))
            for (const author of paper.authors) {
                dispatch(addUsersToDictionary(author.user))
            }
            dispatch(addFieldsToDictionary(paper.fields))

            payload.result = returnedPaper
            dispatch(papersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(papersSlice.actions.failRequest(payload))
        })

        return requestId
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
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(papersSlice.actions.garbageCollectRequests(cacheTTL))

        const endpoint = '/paper/' + id

        const requestId = uuidv4()
        const payload = {
            requestId: requestId
        }

        dispatch(papersSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(paper) {
            for(const author of paper.authors) {
                dispatch(addUsersToDictionary(author.user))
            }
            dispatch(addFieldsToDictionary(paper.fields))
            dispatch(papersSlice.actions.addPapersToDictionary(paper))

            payload.result = paper
            dispatch(papersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(papersSlice.actions.failRequest(payload))
        })

        return requestId
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
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(papersSlice.actions.garbageCollectRequests(cacheTTL))
    
        const endpoint = '/paper/' + paper.id

        const requestId = uuidv4()
        const payload = {
            requestId: requestId
        }

        dispatch(papersSlice.actions.makeRequest({requestId: requestId, method: 'PUT', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paper)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()

            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }

        }).then(function(returnedPaper) {
            for(const author of returnedPaper.authors) {
                dispatch(addUsersToDictionary(author.user))
            }
            dispatch(addFieldsToDictionary(returnedPaper.fields))
            dispatch(papersSlice.actions.addPapersToDictionary(returnedPaper))
            payload.result = returnedPaper
            dispatch(papersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(papersSlice.actions.failRequest(payload))
        })

        return requestId
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
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(papersSlice.actions.garbageCollectRequests(cacheTTL))

        const requestId = uuidv4()
        const endpoint = '/paper/' + paper.id

        const payload = {
            requestId: requestId
        }

        dispatch(papersSlice.actions.makeRequest({requestId: requestId, method: 'PATCH', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paper)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedPaper) {
            for(const author of returnedPaper.authors) {
                dispatch(addUsersToDictionary(author.user))
            }
            dispatch(addFieldsToDictionary(returnedPaper.fields))
            dispatch(papersSlice.actions.addPapersToDictionary(returnedPaper))
            payload.result = returnedPaper
            dispatch(papersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(papersSlice.actions.failRequest(payload))
        })

        return requestId
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
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(papersSlice.actions.garbageCollectRequests(cacheTTL))

        const requestId = uuidv4()
        const endpoint = '/paper/' + paper.id

        const payload = {
            requestId: requestId,
            result: paper.id
        }
        
        dispatch(papersSlice.actions.makeRequest({requestId: requestId, method: 'DELETE', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if( response.ok ) {
                dispatch(papersSlice.actions.removePapers(paper))
                dispatch(papersSlice.actions.completeRequest(payload))
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(papersSlice.actions.failRequest(payload))
        })

        return requestId
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
 * @param {object} paper - A populated paper object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchPaperVersion = function(paper, version) {
    return function(dispatch, getState) {
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(papersSlice.actions.garbageCollectRequests(cacheTTL))

        const endpoint = `/paper/${paper.id}/version/${version.version}`

        const requestId = uuidv4()
        const payload = {
            requestId: requestId
        }

        dispatch(papersSlice.actions.makeRequest({requestId:requestId, method: 'PATCH', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(version)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedPaper) {
            for(const author of returnedPaper.authors) {
                dispatch(addUsersToDictionary(author.user))
            }
            dispatch(addFieldsToDictionary(returnedPaper.fields))
            dispatch(papersSlice.actions.addPapersToDictionary(returnedPaper))

            payload.result = returnedPaper
            dispatch(papersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(papersSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * PATCH /paper/:id/version/:version
 *
 * Create a new version of a paper.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paper - A populated paper object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postPaperVersions = function(paper, version) {
    return function(dispatch, getState) {
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(papersSlice.actions.garbageCollectRequests(cacheTTL))

        const endpoint = `/paper/${paper.id}/versions`

        const requestId = uuidv4()
        const payload = {
            requestId: requestId
        }

        dispatch(papersSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(version)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedPaper) {
            for(const author of returnedPaper.authors) {
                dispatch(addUsersToDictionary(author.user))
            }
            dispatch(addFieldsToDictionary(returnedPaper.fields))
            dispatch(papersSlice.actions.addPapersToDictionary(returnedPaper))

            payload.result = returnedPaper
            dispatch(papersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(papersSlice.actions.failRequest(payload))
        })

        return requestId
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
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(papersSlice.actions.garbageCollectRequests(cacheTTL))

        const endpoint = `/paper/${vote.paperId}/votes`

        const requestId = uuidv4()
        const payload = {
            requestId: requestId
        }

        dispatch(papersSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vote)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedVote) {
            dispatch(papersSlice.actions.addVoteToPaper(returnedVote))

            payload.result = returnedVote 
            dispatch(papersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(papersSlice.actions.failRequest(payload))
        })

        return requestId
    }
}


export const {  addPapersToDictionary, appendPapersToList, removePapers, clearList, completePostVotesRequest, cleanupRequest   }  = papersSlice.actions

export default papersSlice.reducer
