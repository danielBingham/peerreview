import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration' 

import RequestTracker  from './helpers/requestTracker'
import handleError from './helpers/handleError'

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

        // ================== GET /authenticate ===============================

        /**
         * Complete a request to GET /authenticate by setting currentUser with
         * the returned user.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.user - A populated `user` object
         */
        completeGetAuthenticateRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            state.currentUser = action.payload.user
        },

        // ================== POST /authenticate ==============================

        /**
         * Complete a reqeust to POST /authenticate by either setting the
         * currentUser back to null (in the case authorization failed) or
         * setting the currentUser to the returned user object (our newly
         * authenticated user).
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.user - A populated `user` object. 
         */
        completePostAuthenticateRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            state.currentUser = action.payload.user
        },

        // ================== GET /logout =====================================

        /**
         * Complete a request to GET /logout.  The backend will have destroyed
         * the session, we just need to wipe currentUser to destroy the
         * frontend's record of the session.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         */
        completeGetLogoutRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            state.currentUser = null
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
 * GET /authenticate
 *
 * Retrieve the currently authenticated user from the backend's session.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getAuthenticatedUser = function() {
    return function(dispatch, getState) {

        const requestId = uuidv4()
        const endpoint = '/authentication'

        dispatch(authenticationSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            if ( response.ok ) {
                if ( response.status == 200) {
                    return response.json()
                } else if( response.status == 204 ) {
                    // No authenticated users
                    return null
                } else {
                    console.log('Unrecognized status: ' + response.status)
                    return Promise.reject({ status: response.status, error: 'Unrecognized status.'})
                }
            } else {
                return Promise.reject({ status: response.status, error: 'Unrecognized status.' })
            }
        }).then(function(user) {
            dispatch(authenticationSlice.actions.completeGetAuthenticateRequest({requestId: requestId, user: user}))
        }).catch(function(error) {
            handleError(dispatch, authenticationSlice.actions.failRequest, requestId, error)
        })

        return requestId
    }
}

/**
 * POST /authenticate
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
export const authenticate = function(email, password) {
    return function(dispatch, getState) {

        const requestId = uuidv4()
        const endpoint = '/authentication'

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
            if(response.ok) {
                return response.json()
            } else if (response.status == 403) {
                return Promise.reject({status: response.status, error: 'Authentication failed.'})
            } else {
                console.log('Unrecognized status: ' + response.status)
                return Promise.reject({status: response.status, error: 'Unrecognized status.'})
            }
        }).then(function(user) {
            dispatch(authenticationSlice.actions.completePostAuthenticateRequest({requestId: requestId, user: user}))
        }).catch(function(error) {
            handleError(dispatch, authenticationSlice.actions.failRequest, requestId, error)
        })

        return requestId
    }
}

/**
 * GET /logout
 *
 * Attempt to logout the current user from the backend, destroying their
 * session on the backend before destroying it on the frontend.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that we can use to track this request.
 */
export const logout = function() {
    return function(dispatch, getState) {

        const requestId = uuidv4()
        const endpoint = '/authentication'

        dispatch(authenticationSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            if (response.ok) {
                dispatch(authenticationSlice.actions.completeGetLogoutRequest({requestId: requestId}))
            } else {
                return Promise.reject({status: response.status, error: 'Unrecognized status.'})
            }
        }).catch(function(error) {
            handleError(dispatch, authenticationSlice.actions.failRequest, requestId, error)
        })

        return requestId
    }
}

export const {completeGetAuthenticateRequest, completePostAuthenticateRequest, completeGetLogoutRequest,
    makeRequest, failRequest, cleanupRequest} = authenticationSlice.actions

export default authenticationSlice.reducer
