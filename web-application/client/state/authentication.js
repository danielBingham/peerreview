import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import logger from '../logger'
import RequestError from '/errors/RequestError'

import { 
    makeSearchParams,
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    bustRequestCache,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests } from './helpers/requestTracker'

import { addSettingsToDictionary } from '/state/settings'
import { reset } from '/state/system'
import { setUsersInDictionary } from '/state/users'

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

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useRequest,
        bustRequestCache: bustRequestCache,
        cleanupRequest: function(state, action) {
            // Don't cache authentication requests.
            action.payload.cacheTTL = 0  
            cleanupTrackedRequest(state, action)
        }, 
        garbageCollectRequests: function(state, action) {
            // Don't cache authentication requests.
            action.payload = 0  
            garbageCollectRequests(state, action)
        }
    }

})

/**
 * Call getAuthentication and cleanup the created request as soon as it
 * returns.  
 *
 * Use this to refresh authentication in contexts where we don't need to track
 * the request.
 */
export const refreshAuthentication = function() {
    return function(dispatch, getState) {
        const requestId = dispatch(getAuthentication(function() {
            dispatch(authenticationSlice.actions.cleanupRequest({ requestId: requestId }))
        }))
    }
}

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
export const getAuthentication = function(onCompletion) {
    return function(dispatch, getState) {
        const endpoint = '/authentication'

        // Don't need to bust the cache for authentication requests, because we
        // override cleanupRequest to avoid caching them at all.
        return makeTrackedRequest(dispatch, getState, authenticationSlice,
            'GET', endpoint, null,
            function(responseBody ) {
                if ( responseBody && responseBody.user ) {
                    dispatch(authenticationSlice.actions.setCurrentUser(responseBody.user))
                    dispatch(authenticationSlice.actions.setSettings(responseBody.settings))
                    dispatch(addSettingsToDictionary(responseBody.settings))
                    dispatch(setUsersInDictionary({ entity: responseBody.user }))
                } else if ( responseBody ) {
                    dispatch(authenticationSlice.actions.setCurrentUser(null))
                    dispatch(authenticationSlice.actions.setSettings(responseBody.settings))
                }

                if ( onCompletion ) {
                    onCompletion()
                }
            }
        )

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
        const endpoint = '/authentication'
        const body = {
            email: email,
            password: password
        }
        dispatch(authenticationSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, authenticationSlice,
            'POST', endpoint, body,
            function(responseBody) {
                dispatch(authenticationSlice.actions.setCurrentUser(responseBody.user))
                dispatch(authenticationSlice.actions.setSettings(responseBody.settings))
                dispatch(addSettingsToDictionary(responseBody.settings))
                dispatch(setUsersInDictionary({ entity: responseBody.user }))
            }
        )
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
       const endpoint = '/authentication'
        const body = {
            email: email,
            password: password
        }
        return makeTrackedRequest(dispatch, getState, authenticationSlice,
            'PATCH', endpoint, body)
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
        const endpoint = '/authentication'

        dispatch(authenticationSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, authenticationSlice,
            'DELETE', endpoint, null,
            function(responseBody) {
                dispatch(reset())
                // As soon as we reset the redux store, we need to redirect to
                // the home page.  We don't want to go through anymore render
                // cycles because that could have undefined impacts.
                window.location.href = "/"
            }
        )
    }
}

/**
 * POST /orcid/authentication
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
export const postOrcidAuthentication = function(code, connect) {
    return function(dispatch, getState) {
        const endpoint = '/orcid/authentication'
        const body = {
            code: code,
            connect: connect
        }

        return makeTrackedRequest(dispatch, getState, authenticationSlice,
            'POST', endpoint, body,
            function(responseContent) {
                dispatch(authenticationSlice.actions.setCurrentUser(responseContent.user))
                dispatch(authenticationSlice.actions.setSettings(responseContent.settings))
                dispatch(addSettingsToDictionary(responseContent.settings))
                dispatch(setUsersInDictionary({ entity: responseContent.user }))
            }
        )
    }
}

export const validateToken = function(token, type) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams({type: type}) 
        const endpoint = `/token/${token}?${ queryString.toString() }`

        return makeTrackedRequest(dispatch, getState, authenticationSlice,
            'GET', endpoint, null,
            function(responseContent) {
                dispatch(authenticationSlice.actions.setCurrentUser(responseContent.user))
                dispatch(authenticationSlice.actions.setSettings(responseContent.settings))
                dispatch(addSettingsToDictionary(responseContent.settings))
                dispatch(setUsersInDictionary({ entity: responseContent.user }))
            }
        )
    }
}

export const createToken = function(params) {
    return function(dispatch, getState) {
        const endpoint = `/tokens`
        return makeTrackedRequest(dispatch, getState, authenticationSlice,
            'POST', endpoint, params,
            function(responseContent) {

            }
        )
    }
}

export const { setCurrentUser, setSettings, cleanupRequest} = authenticationSlice.actions

export default authenticationSlice.reducer
