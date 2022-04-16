import { createSlice } from '@reduxjs/toolkit'
import configuration from './config' 

export const authenticationSlice = createSlice({
    name: 'authentication',
    initialState: {
        getAuthenticatedUser: {
            requested: false,
            requestInProgress: false,
            requestErrored: false,
            error: null,
        },
        authenticate: {
            requestInProgress: false,
            requestErrored: false,
            error: null,
            failed: false
        },
        logout: {
            requestInProgress: false,
            requestErrored: false,
            error: null
        },
        currentUser: null
    },
    reducers: {
        // getAuthenticatedUser 
        requestAuthenticatedUser: function(state, action) {
            state.getAuthenticatedUser.requested = true
            state.getAuthenticatedUser.requestInProgress = true 
            state.getAuthenticatedUser.requestErrored = false
            state.getAuthenticatedUser.error = null
        },
        requestAuthenticatedUserErrored: function(state, action) {
            state.getAuthenticatedUser.requestInProgress = false
            state.getAuthenticatedUser.requestErrored = true
            state.getAuthenticatedUser.error = action.payload
        },
        setAuthenticatedUser: function(state, action) {
            state.getAuthenticatedUser.requestInProgress = false
            state.getAuthenticatedUser.requestErrored = false
            state.getAuthenticatedUser.error = null
            state.currentUser = action.payload
        },

        // authenticate
        requestAuthenticate: function(state, action) {
            state.authenticate.requestInProgress = true
            state.authenticate.requestErrored = false
            state.authenticate.error = null
        },
        requestAuthenticateErrored: function(state, action) {
            state.authenticate.requestInProgress = false
            state.authenticate.requestErrored = true
            state.authenticate.error = action.payload
        },
        authenticateFailed: function(state, action) {
            state.authenticate.requestInProgress = false
            state.authenticate.requestErrored = false
            state.authenticate.error = null
            state.authenticate.failed = true
        },
        authenticateSucceeded: function(state, action) {
            state.authenticate.requestInProgress = false
            state.authenticate.requestErrored = false
            state.authenticate.error = null
            state.currentUser = action.payload
        },

        // Logout
        requestLogout: function(state, action) {
            state.logout.requestInProgress = true
            state.logout.requestErrored = false
            state.logout.error = null
        },
        requestLogoutErrored: function(state, action) {
            state.logout.requestInProgress = false
            state.logout.requestErrored = true
            state.logout.error = action.payload.error
        },
        logoutSucceeded: function(state, action) {
            state.logout.requestInProgress = false
            state.logout.requestErrored = false
            state.logout.error = null
            state.currentUser = null
        }
    }

})

export const getAuthenticated = function() {
    return async function(dispatch, getState) {
        dispatch(authenticationSlice.actions.requestAuthenticatedUser())
        try {
            const rawResponse= await fetch(configuration.backend + '/authenticate',
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            const response = await rawResponse.json()

            if (response.success == true) {
                dispatch(authenticationSlice.actions.setAuthenticatedUser(response.user))
            } 
        } catch (error) {
            console.log("ERROR IN getAuthenticated:")
            console.log(error)
            dispatch(authenticationSlice.actions.requestAuthenticatedUserErrored(error))
        }
    }
}

export const authenticate = function(email, password) {
    return async function(dispatch, getState) {
        dispatch(authenticationSlice.actions.requestAuthenticate())

        try {
            const rawResponse = await fetch(configuration.backend + '/authenticate',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                })
            const response = await rawResponse.json()
            if (response.success == true) {
                dispatch(authenticationSlice.actions.authenticateSucceeded(response.user))
            } else {
                dispatch(authenticationSlice.actions.authenticateFailed())
            }
        } catch (error) {
            console.log("ERROR IN authenticate: ")
            console.log(error)
            dispatch(authenticationSlice.actions.requestAuthenticateErrored(error))
        }

    }
}

export const logout = function() {
    return async function(dispatch, getState) {
        dispatch(authenticationSlice.actions.requestLogout())
        try {
            const rawResponse = await fetch(configuration.backend + '/logout',
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            const response = await rawResponse.json()
            if (response.success == true) {
                dispatch(authenticationSlice.actions.logoutSucceeded())
            } else {
                dispatch(authenticationSlice.actions.requestFailed())
            }
        } catch (error) {
            console.log("ERROR IN logout: ")
            console.log(error)
            dispatch(authenticationSlice.actions.requestLogoutErrored(error))
        }
    }
}

export const {requestAuthenticatedUser, requestAuthenticatedUserErrored, setAuthenticatedUser,
                requestAuthenticate, requestAuthenticateErrored, authenticateFailed, authenticateSucceeded,
                requestLogout, requestLogoutErrored, logoutSucceeded } = authenticationSlice.actions

export default authenticationSlice.reducer
