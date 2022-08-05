import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration' 
import logger from '../logger'

import { makeRequest as makeTrackedRequest, 
    failRequest as failTrackedRequest, 
    completeRequest as completeTrackedRequest, 
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

import { addSettingsToDictionary } from '/state/settings'
import { reset } from '/state/system'

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
        currentUser: null,

        settings: null
    },
    reducers: {

        setCurrentUser: function(state, action) {
            state.currentUser = action.payload
        },

        setSettings: function(state, action) {
            state.settings = action.payload
        },

        // ========== Request Tracking Methods =============

        makeRequest: makeTrackedRequest, 
        failRequest: failTrackedRequest, 
        completeRequest: completeTrackedRequest,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
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
        // Cleanup dead requests before making a new one.
        dispatch(authenticationSlice.actions.garbageCollectRequests())

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
                }  else {
                    return Promise.reject(new Error('Request failed with status: ' + response.status))
                }
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(session) {
            if ( session && session.user ) {
                dispatch(authenticationSlice.actions.setCurrentUser(session.user))
                dispatch(authenticationSlice.actions.setSettings(session.settings))
                dispatch(addSettingsToDictionary(session.settings))
            } else {
                dispatch(authenticationSlice.actions.setCurrentUser(null))
                dispatch(authenticationSlice.actions.setSettings(session.settings))
            }

            payload.result = session 
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
        // Cleanup dead requests before making a new one.
        dispatch(authenticationSlice.actions.garbageCollectRequests())

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
        }).then(function(session) {
            dispatch(authenticationSlice.actions.setCurrentUser(session.user))
            dispatch(authenticationSlice.actions.setSettings(session.settings))
            dispatch(addSettingsToDictionary(session.settings))

            payload.result = session 
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
 * PATCH /authentication
 *
 * Check a user's credentials, with out modifying the session.  Does retrieve
 * the user (on authentication) and store them the result. 
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @param {string} email - The email of the user we'd like to authenticate.
 * @param {string} password - Their password.
 *
 * @returns {string} A uuid requestId we can use to track this request.
 */
export const patchAuthentication = function(email, password) {
    return function(dispatch, getState) {
        // Cleanup dead requests before making a new one.
        dispatch(authenticationSlice.actions.garbageCollectRequests())

        const requestId = uuidv4()
        const endpoint = '/authentication'

        let payload = {
            requestId: requestId
        }

        dispatch(authenticationSlice.actions.makeRequest({requestId: requestId, method: 'PATCH', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PATCH',
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
        // Cleanup dead requests before making a new one.
        dispatch(authenticationSlice.actions.garbageCollectRequests())

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
                dispatch(authenticationSlice.actions.completeRequest(payload))
                dispatch(reset())
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

export const { setCurrentUser, setSettings, makeRequest, failRequest, completeRequest, cleanupRequest} = authenticationSlice.actions

export default authenticationSlice.reducer
