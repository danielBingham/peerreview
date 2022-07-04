import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '/configuration'
import logger from '/logger'

import RequestTracker from './helpers/requestTracker'

import { setCurrentUser } from '/state/authentication'

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
        dictionary: {},

        /** 
         * A list of users returned from /users/query.  We need to use a list
         * here, because we need to preserve the order returned from the
         * backend.  The query can include a `sort` parameter.  We can only run
         * one query at a time, subsequent queries will be assumed to build on
         * it. If you need to start a new query, call the `newQuery` action.
         */
        list: []
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
        addUsersToDictionary: function(state, action) {
            if (Array.isArray(action.payload)) {
                action.payload.forEach(function(user) {
                    state.dictionary[user.id] = user
                })
            } else if( action.payload.id ) {
                const user = action.payload
                state.dictionary[user.id] = user 
            } else {
                throw new TypeError('Payload must be an array of users or a user.')
            }
        },

        /**
         * Add one or more users to the list.
         *
         * @param {object} state    The redux state slice.
         * @param {object} action   The redux action we're reducing.
         * @param {object|object[]} action.payload  A user or an array of users
         * we want to append to the end of the list.
         */
        appendUsersToList: function(state, action) {
            if ( Array.isArray(action.payload)) {
                state.list.push(...action.payload)
            } else if ( action.payload.id ) {
                state.list.push(action.payload)
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
        clearList: function(state, action) {
            state.list = []
        },

        /**
         * Remove a user from both the dictionary and the list.
         *
         * @param {object} state    The redux state slice.
         * @param {object} action   The action we're reducing.
         * @param {object} action.payload   A user object.  The one we want to remove.
         */
        removeUser: function(state, action) {
            delete state.dictionary[action.payload.id]
            state.list = state.list.filter((u) => u.id != action.payload.id)
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
 * GET /users?...
 *
 * Get all users in the database. Queryable.  Populates state.dictionary and
 * state.list.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getUsers = function(params) {
    return function(dispatch, getState) {
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
        const endpoint = '/users' + ( params ? '?' + queryString.toString() : '')

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
            dispatch(usersSlice.actions.addUsersToDictionary(users))
            dispatch(usersSlice.actions.appendUsersToList(users))

            payload.result = users
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
            dispatch(usersSlice.actions.addUsersToDictionary(returnedUser))

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
            dispatch(usersSlice.actions.addUsersToDictionary(user))

            // If the user we just got is the same as the one in the session,
            // update the session.  The server will have already done this for
            // the backend, doubling the login on the frontend just saves us a
            // request.
            const state = getState()
            if ( state.authentication.currentUser && state.authentication.currentUser.id == user.id) {
                dispatch(setCurrentUser(user))
            }

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
            dispatch(usersSlice.actions.addUsersToDictionary(returnedUser))

            // If the user we just got is the same as the one in the session,
            // update the session.  The server will have already done this for
            // the backend, doubling the login on the frontend just saves us a
            // request.
            const state = getState()
            if ( state.authentication.currentUser && state.authentication.currentUser.id == returnedUser.id) {
                dispatch(setCurrentUser(returnedUser))
            }

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
            dispatch(usersSlice.actions.addUsersToDictionary(returnedUser))

            // If the user we just got is the same as the one in the session,
            // update the session.  The server will have already done this for
            // the backend, doubling the login on the frontend just saves us a
            // request.
            const state = getState()
            if ( state.authentication.currentUser && state.authentication.currentUser.id == returnedUser.id) {
                dispatch(setCurrentUser(returnedUser))
            }

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
                dispatch(usersSlice.actions.removeUser(user))
                dispatch(usersSlice.actions.completeRequest(payload))
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

export const { addUsersToDictionary, appendUsersToList, clearList, removeUser, makeRequest, failRequest, completeRequest, cleanupRequest }  = usersSlice.actions

export default usersSlice.reducer
