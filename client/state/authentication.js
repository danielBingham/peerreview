import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from './config' 

import RequestTracker  from './requestTracker'

export const authenticationSlice = createSlice({
    name: 'authentication',
    initialState: {
        requests: {},
        currentUser: null
    },
    reducers: {
        // getAuthenticatedUser 
        requestGetAuthenticate: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker('GET', 'authenticate')
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },
        completeGetAuthenticate: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
            state.currentUser = action.payload.user
        },

        // authenticate
        requestPostAuthenticate: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker('POST', 'authenticate')
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },
        completePostAuthenticate: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            if (action.payload.user = 'authorization-rejected') {
                state.currentUser = null
            } else {
                state.currentUser = action.payload.user
            }
        },

        // Logout
        requestGetLogout: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker('GET', 'logout')
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },
        completeGetLogout: function(state, action) {
            RequestTracker.completeRequest(state.requsets[action.payload.requestId], action)

            state.currentUser = null
        },

        // Failure
        failRequest: function(state, action) {
            RequestTracker.failRequest(state.requests[action.payload.requestId], action)
        },
        
        // Cleanup
        cleanupRequest: function(state, action) {
            delete state.requests[action.payload.requestId]
        }
    }

})

export const getAuthenticatedUser = function() {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        dispatch(authenticationSlice.actions.requestGetAuthenticate({requestId: requestId}))
        fetch(configuration.backend + '/authenticate', {
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
            dispatch(authenticationSlice.actions.completeGetAuthenticate({requestId: requestId, user: user}))
        }).catch(function(error) {
            if (error instanceof Error) {
                console.log(error)
                dispatch(authenticationSlice.actions.failRequest({requestId: requestId, error: error.toString()}))
            } else if( error.status ) {
                dispatch(authenticationSlice.actions.failRequest({requestId: requestId, status: error.status, error: error.status}))
            } else {
                console.log(error)
                dispatch(authenticationSlice.actions.failRequest({requestId: requestId, error: 'unknown'}))
            }
        })
        return requestId
    }
}

export const authenticate = function(email, password) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        dispatch(authenticationSlice.actions.requestPostAuthenticate({requestId: requestId}))
        fetch(configuration.backend + '/authenticate', {
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
                return Promise.reject({status: response.status, error: 'Unrecognized status.'})
            }
        }).then(function(user) {
            dispatch(authenticationSlice.actions.completePostAuthenticate({responseId: responseId, user: user}))
        }).catch(function(error) {
            if (error instanceof Error) {
                console.log(error)
                dispatch(authenticationSlice.actions.failRequest({requestId: requestId, error: error.toString()}))
            } else if( error.status ) {
                dispatch(authenticationSlice.actions.failRequest({requestId: requestId, status: error.status, error: error.error}))
            } else {
                console.log(error)
                dispatch(authenticationSlice.actions.failRequest({requestId: requestId, error: 'unknown'}))
            }
        })
        return requestId
    }
}

export const logout = function() {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        dispatch(authenticationSlice.actions.requestGetLogout({requestId: requestId}))
        fetch(configuration.backend + '/logout', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            if (response.ok) {
                dispatch(authenticationSlice.actions.completeGetLogout({requestId: requestId}))
            } else {
                return Promise.reject({status: response.status, error: 'Unrecognized status.'})
            }
        }).catch(function(error) {
            if (error instanceof Error) {
                console.log(error)
                dispatch(authenticationSlice.actions.failRequest({requestId: requestId, error: error.toString()}))
            } else if( error.status ) {
                dispatch(authenticationSlice.actions.failRequest({requestId: requestId, status: error.status, error: error.error}))
            } else {
                console.log(error)
                dispatch(authenticationSlice.actions.failRequest({requestId: requestId, error: 'unknown'}))
            }
        })
    }
}

export const {requestGetAuthenticate, completeGetAuthenticate, 
                requestPostAuthenticate, completePostAuthenticate, 
    requestGetLogout, completeGetLogout, 
    failRequest, cleanupRequest} = authenticationSlice.actions

export default authenticationSlice.reducer
