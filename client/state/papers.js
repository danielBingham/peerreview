import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration'
import logger from '../logger'

import { addFieldsToDictionary } from './fields'
import { addUsersToDictionary } from './users'
import RequestTracker from './helpers/requestTracker'

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
        list: []
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

        /**
         * Clear the list, as when you want to start a new ordered query.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         */
        clearList: function(state, action) {
            state.list = []
        },

        // ======== POST /paper/:id/votes =====================================

        /**
         * Finish the POST /paper/:id/votes request by adding the vote to the
         * paper's vote array in the database.
         *
         * TECHDEBT Assumes we're posting votes on a paper we've already pulled
         * to the frontend.  Not necessarily a safe assumption.
         */
        completePostVotesRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
            state.dictionary[action.payload.result.paperId].votes.push(action.payload.result)
        },

        // TECHDEBT Assumes we're never getting votes for a paper we haven't
        // already queried into the database. Not necessarily a safe
        // assumption.
        completeGetVotesRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
            for(const vote of action.payload.result) {
                state.dictionary[vote.paper_id].votes.push(vote)
            }
        },

        // ========== Generic Request Methods =============
        // Use these methods when no extra logic is needed.  If additional
        // logic is needed for a particular request, make a reducer of the form
        // [make/fail/complete/cleanup][method][endpoint]Request().  For
        // example, makePostPapersRequest().  The reducer should take an object
        // with at least requestId defined, along with whatever all inputs it
        // needs.

        /**
         * Make a request to a paper or papers endpoint.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {string} action.payload.method - One of the HTTP verbs
         * @param {string} action.payload.endpoint - The endpoint we're making the request to
         */
        makeRequest: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker(action.payload.method, action.payload.endpoint)
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Fail a request to a paper or papers endpoint, usually with an error.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {int} action.payload.status - (Optional) The status code returned with the response.
         * @param {string} action.payload.error - (Optional) A string error message.
         */
        failRequest: function(state, action) {
            RequestTracker.failRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Complete a request to a paper or papers endpoint by setting the paper
         * sent back by the backend in the papers hash.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.result - A populated paper object, must have `id` defined
         */
        completeRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Cleanup a request by removing it from our request hash.  Once we're
         * done with a request, we don't need to keep its tracking around.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         */
        cleanupRequest: function(state, action) {
            delete state.requests[action.payload.requestId]
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
export const getPapers = function(params) {
    return function(dispatch, getState) {
        console.log(`\n\n ==== getPapers ==== `)
        console.log('Params')
        console.log(params)
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

        const requestId = uuidv4() 
        const endpoint = '/papers' + ( params ? '?' + queryString.toString() : '')
        console.log('endpoint')
        console.log(endpoint)

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
        console.log(`\n\n ==== END getPapers ====`)

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
        const requestId = uuidv4()
        const endpoint = '/papers'

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
 * POST /paper/:id/upload
 *
 * Upload a new version of a paper.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paper - A populated paper object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const uploadPaper = function(id, file) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = '/paper/' + id + '/upload'

        const payload = {
            requestId: requestId,
            paper_id: id
        }

        var formData = new FormData()
        formData.append('paperVersion', file)

        dispatch(papersSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            body: formData 
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

        const requestId = uuidv4()
        const endpoint = '/paper/' + id

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
    
        const requestId = uuidv4()
        const endpoint = '/paper/' + paper.id

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
 * GET /paper/:paper_id/votes
 *
 * Get all votes on this paper from the database.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getVotes = function(paper_id) {
    return function(dispatch, getState) {
        const requestId = uuidv4() 
        const endpoint = `/paper/${paper_id}/votes`

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
        }).then(function(votes) {
            payload.result = votes
            dispatch(papersSlice.actions.completeGetVotesRequest(payload))
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

        const requestId = uuidv4()
        const endpoint = `/paper/${vote.paperId}/votes`

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
            payload.result = returnedVote 
            console.log(payload)
            dispatch(papersSlice.actions.completePostVotesRequest(payload))
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


export const {  addPapersToDictionary, appendPapersToList, removePapers, clearList, completePostVotesRequest, makeRequest, failRequest, completeRequest, cleanupRequest }  = papersSlice.actions

export default papersSlice.reducer
