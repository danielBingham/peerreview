import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration'
import logger from '../logger'

import RequestTracker from './helpers/requestTracker'

export const usersSlice = createSlice({
    name: 'users',
    initialState: {
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of users we've retrieved from the backend, keyed by
         * user.id.
         *
         * @type {object}
         */
        users: {},

        /** 
         * A list of users returned from /users/query.  We need to use a list
         * here, because we need to preserve the order returned from the
         * backend.  The query can include a `sort` parameter.  We can only run
         * one query at a time, subsequent queries will be assumed to build on
         * it. If you need to start a new query, call the `newQuery` action.
         */
        query: []
    },
    reducers: {
        /**
         * Add one or more users to the user state.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object|object[]} action.payload - The payload sent with the
         * action, must either be an array of users or a user.
         */
        addUsers: function(state, action) {
            if (Array.isArray(action.payload)) {
                action.payload.forEach(function(user) {
                    state.users[user.id] = user
                })
            } else if( action.payload.id ) {
                state.users[action.payload.id] = action.payload
            } else {
                throw new TypeError('Payload must be an array of users or a user.')
            }
        },

        /**
         * Reset the query, so that you can run a new one.
         *
         * @param {Object} state - The redux state slice.
         * @param {Object} action - The redux action we're reducing.
         */
        newQuery: function(state, action) {
            state.query = []
        },

        // ========== GET /users/query?... ====================================

        /**
         * The GET request to /users/query?... succeeded.  We need to process the users into
         * both the dictionary and the query list.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - the redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action. 
         * @param {object} action.payload.requestId - A uuid for the request we're completing.
         * @param {object[]} action.payload.users - An array of populated user objects.
         */
        completeQueryUsersRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            if ( action.payload.result.length > 0 ) {
                for(const user of action.payload.result) {
                    state.users[user.id] = user
                    state.query.push(user)
                }
            }
        },

        // ========== GET /users ==============================================

        /**
         * The GET request to /users succeeded.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.users - An array of populated user objects
         */
        completeGetUsersRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            for ( const user of action.payload.result ) {
                state.users[user.id] = user
            }
        },

        // ========== DELETE /user/:id =================

        /**
         * Finish the DELETE /user/:id call.  In this case, the call returns
         * the id of the deleted user and we need to delete them from state on
         * our side.  
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.userId - The id of the deleted user
         */
        completeDeleteUserRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
            delete state.users[action.payload.result]
        },

        // ========== GET /user/:id/papers ==============================================

        /**
         * The GET request to /user/:id/papers succeeded.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.userId - The of the user we requested papers for.
         * @param {object} action.payload.result - A populated list of papers the user was an author on.
         */
        completeGetUserPapersRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            state.users[action.payload.userId].papers = action.payload.result
        },

        // ========== Generic Request Methods =============
        // Use these methods when no extra logic is needed.  If additional
        // logic is needed for a particular request, make a reducer of the form
        // [make/fail/complete/cleanup][method][endpoint]Request().  For
        // example, makePostUsersRequest().  The reducer should take an object
        // with at least requestId defined, along with whatever all inputs it
        // needs.

        /**
         * Make a request to a user or users endpoint.
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
         * Fail a request to a user or users endpoint, usually with an error.
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
         * Complete a request to a user or users endpoint by setting the user
         * sent back by the backend in the users hash.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.user - A populated user object, must have `id` defined
         */
        completeRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            const user = action.payload.result
            state.users[user.id] = user 

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

// TODO These need to update currentUser when the user returned == current user.

export const queryUsers = function(name) {
    return function(dispatch, getState) {
        const params = new URLSearchParams({ name: name })

        const requestId = uuidv4() 
        const endpoint = '/users/query?' + params.toString()

        let payload = {
            requestId: requestId
        }

        dispatch(usersSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
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
        }).then(function(users) {
            payload.result = users
            dispatch(usersSlice.actions.completeQueryUsersRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(usersSlice.actions.failRequest(payload))
        })

        return requestId
    }

}


/**
 * GET /users
 *
 * Get all users in the database.  Populates state.users.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getUsers = function() {
    return function(dispatch, getState) {

        const requestId = uuidv4() 
        const endpoint = '/users'

        let payload = {
            requestId: requestId
        }


        dispatch(usersSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
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
        }).then(function(users) {
            payload.result = users
            dispatch(usersSlice.actions.completeGetUsersRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(usersSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * POST /users
 *
 * Create a new user.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} user - A populated user object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postUsers = function(user) {
    return function(dispatch, getState) {

        const requestId = uuidv4()
        const endpoint = '/users'

        const payload = {
            requestId: requestId
        }

        dispatch(usersSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedUser) {
            payload.result = returnedUser
            dispatch(usersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(usersSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * GET /user/:id
 *
 * Get a single user.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the user we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getUser = function(id) {
    return function(dispatch, getState) {

        const requestId = uuidv4()
        const endpoint = '/user/' + id

        const payload = {
            requestId: requestId
        }

        dispatch(usersSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
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
        }).then(function(user) {
            payload.result = user
            dispatch(usersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(usersSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * PUT /user/:id
 *
 * Replace a user wholesale. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} user - A populated user object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const putUser = function(user) {
    return function(dispatch, getState) {
    
        const requestId = uuidv4()
        const endpoint = '/user/' + user.id

        const payload = {
            requestId: requestId
        }

        dispatch(usersSlice.actions.makeRequest({requestId: requestId, method: 'PUT', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()

            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }

        }).then(function(returnedUser) {
            payload.result = returnedUser
            dispatch(usersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(usersSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * PATCH /user/:id
 *
 * Update a user from a partial `user` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} user - A populate user object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchUser = function(user) {
    return function(dispatch, getState) {

        const requestId = uuidv4()
        const endpoint = '/user/' + user.id

        const payload = {
            requestId: requestId
        }

        dispatch(usersSlice.actions.makeRequest({requestId: requestId, method: 'PATCH', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedUser) {
            payload.result = returnedUser
            dispatch(usersSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(usersSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * DELETE /user/:id
 *
 * Delete a user. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} user - A populated user object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteUser = function(user) {
    return function(dispatch, getState) {

        const requestId = uuidv4()
        const endpoint = '/user/' + user.id

        const payload = {
            requestId: requestId,
            result: user.id
        }
        
        dispatch(usersSlice.actions.makeRequest({requestId: requestId, method: 'DELETE', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if( response.ok ) {
                dispatch(usersSlice.actions.completeDeleteUserRequest(payload))
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
            dispatch(usersSlice.actions.failRequest(payload))
        })

        return requestId
    }
} 

/**
 * GET /user/:id/papers
 *
 * Get the papers a user is an author on..
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the user we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getUserPapers = function(id) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = `/user/${id}/papers`

        const payload = {
            requestId: requestId,
            userId: id
        }

        dispatch(usersSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
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
            payload.result = papers 
            dispatch(usersSlice.actions.completeGetUserPapersRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(usersSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

export const { addUsers, newQuery, completeQueryUsersRequest, completeGetUsersRequest, completeDeleteUserRequest, makeRequest, failRequest, completeRequest, cleanupRequest }  = usersSlice.actions

export default usersSlice.reducer
