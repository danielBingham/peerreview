import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration' 
import logger from '../logger'

import RequestTracker  from './helpers/requestTracker'

export const authenticationSlice = createSlice({
    name: 'authentication',
    initialState: {
        /**
         * A dictionary of RequestTracker objects as returned by
         * RequestTracker.getRequestTracker, keyed by uuid requestIds.
         * 
         * @type {object}
         */
        requests: {},

        /**
         * A `user` object representing the currentUser.
         *
         * @type {object} 
         */
        currentUser: null
    },
    reducers: {

        setCurrentUser: function(state, action) {
            state.currentUser = action.payload
        },

        // ========== Generic Request Methods =============
        // Use these methods when no extra logic is needed.  If additional
        // logic is needed for a particular request, make a reducer of the form
        // [make/fail/complete/cleanup][method][endpoint]Request().  For
        // example, makeGetAuthenticateRequest().  The reducer should take an object
        // with at least requestId defined, along with whatever all inputs it
        // needs.

        /**
         * Make a request to an authentication endpoint.
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
         * Fail a request to an authentication endpoint, usually with an error.
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
         * Complete a request by setting the current user to the value returned
         * in the payload.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.user - A populated `user` object or NULL.
         */
        completeRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
        },


        /**
         * Cleanup a request once we're finished with it.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The action we're reducing.
         * @param {object} action.payload - The payload.
         * @param {string} action.payload.requestId - A uuid identifying the request we want to cleanup.
         */
        cleanupRequest: function(state, action) {
            delete state.requests[action.payload.requestId]
        }
    }

})

/**
 * GET /authentication
 *
 * Retrieve the currently authenticated user from the backend's session.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getAuthentication = function() {
    return function(dispatch, getState) {

        const requestId = uuidv4()
        const endpoint = '/authentication'

        let payload = {
            requestId: requestId
        }

        dispatch(authenticationSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                if ( response.status == 200) {
                    return response.json()
                } else if( response.status == 204 ) {
                    // No authenticated users
                    return null
                } else {
                    return Promise.reject(new Error('Request failed with status: ' + response.status))
                }
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(user) {
            dispatch(authenticationSlice.actions.setCurrentUser(user))

            payload.result = user
            dispatch(authenticationSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(authenticationSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * POST /authentication
 *
 * Attempt to authenticate a user with the backend, starting the user's session on success.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @param {string} email - The email of the user we'd like to authenticate.
 * @param {string} password - Their password.
 *
 * @returns {string} A uuid requestId we can use to track this request.
 */
export const postAuthentication = function(email, password) {
    return function(dispatch, getState) {

        const requestId = uuidv4()
        const endpoint = '/authentication'

        let payload = {
            requestId: requestId
        }

        dispatch(authenticationSlice.actions.makeRequest({requestId: requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        }).then(function(response) {
            payload.status = response.status
            if(response.ok) {
                return response.json()
            } else if (response.status == 403) {
                return Promise.reject(new Error('Attempt to authenticate "' + email + '" failed.'))
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(user) {
            dispatch(authenticationSlice.actions.setCurrentUser(user))

            payload.result = user
            dispatch(authenticationSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(authenticationSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * DELETE /authentication
 *
 * Attempt to logout the current user from the backend, destroying their
 * session on the backend before destroying it on the frontend.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that we can use to track this request.
 */
export const deleteAuthentication = function() {
    return function(dispatch, getState) {

        const requestId = uuidv4()
        const endpoint = '/authentication'

        let payload = {
            requestId: requestId
        }

        dispatch(authenticationSlice.actions.makeRequest({requestId: requestId, method: 'DELETE', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            payload.result = null
            if (response.ok) {
                dispatch(authenticationSlice.actions.setCurrentUser(null))

                dispatch(authenticationSlice.actions.completeRequest(payload))
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
            dispatch(authenticationSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

export const { setCurrentUser, makeRequest, failRequest, completeRequest, cleanupRequest} = authenticationSlice.actions

export default authenticationSlice.reducer
