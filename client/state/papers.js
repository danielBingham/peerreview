import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration'
import logger from '../logger'

import { addUsers } from './users'
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
        papers: {},
    },
    reducers: {
        // ========== GET /papers ==================

        /**
         * The GET request to /papers succeeded.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.papers - An array of populated paper objects
         */
        completeGetPapersRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            action.payload.papers.forEach(function(paper) {
                state.papers[paper.id] = paper
            })
        },

        // ========== POST /paper/:id/upload ===========
        
        /**
         * Finish the call to /paper/:id/upload by storing the newly created
         * version.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {int}    action.payload.paper_id - The id of the paper we uploaded a version for.
         * @param {object} action.payload.version - The populated version object. 
         */
        completeUploadPaperRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            state.papers[action.payload.paper_id].versions.unshift(action.payload.version)
        },

        // ========== DELETE /paper/:id =================

        /**
         * Finish the DELETE /paper/:id call.  In this case, the call returns
         * the id of the deleted paper and we need to delete them from state on
         * our side.  
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.paperId - The id of the deleted paper
         */
        completeDeletePaperRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
            delete state.papers[action.payload.paperId]
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
         * @param {object} action.payload.paper - A populated paper object, must have `id` defined
         */
        completeRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            const paper = action.payload.paper
            state.papers[paper.id] = paper 

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
export const getPapers = function() {
    return function(dispatch, getState) {

        const requestId = uuidv4() 
        const endpoint = '/papers'

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
            papers.forEach(function(paper) {
                paper.authors.forEach(function(author) {
                    dispatch(addUsers(author.user))
                })
            })
            payload.papers = papers
            dispatch(papersSlice.actions.completeGetPapersRequest(payload))
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
            const state = getState()
            returnedPaper.authors.forEach(function(author) {
                author.user = state.users.users[author.id]
                delete author.id
            })
            payload.paper = returnedPaper
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
        }).then(function(version) {
            payload.version = version 
            dispatch(papersSlice.actions.completeUploadPaperRequest(payload))
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
            paper.authors.forEach(function(author) {
                dispatch(addUsers(author.user))
            })
            payload.paper = paper
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
            payload.paper = returnedPaper
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
            payload.paper = returnedPaper
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
            paperId: paper.id
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
                dispatch(papersSlice.actions.completeDeletePaperRequest(payload))
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


export const { completeGetPapersRequest, completeDeletePaperRequest, makeRequest, failRequest, completeRequest, cleanupRequest }  = papersSlice.actions

export default papersSlice.reducer
