import { createSlice } from '@reduxjs/toolkit'
import configuration from './config'

import getRequestTracker, {makeRequest, failRequest, completeRequest} from './requestTracker'


export const usersSlice = createSlice({
    name: 'users',
    initialState: {
        getUsers: getRequestTracker(),
        postUsers: getRequestTracker(),
        getUser: getRequestTracker(),
        putUser: getRequestTracker(),
        patchUser: getRequestTracker(),
        deleteUser: getRequestTracker(),
        users: {},
    },
    reducers: {
        // ========== GET /users ==================

        /**
         * Start a GET request to /users.
         *
         * No payload.
         */
        requestGetUsers: function(state, action) {
            makeRequest(state.getUsers, action)
        },

        /**
         * The GET request to /users failed with an error at some point.
         *
         * Payload should be the error encountered or an array of errors.
         */
        failGetUsersWithError: function(state, action) {
            failRequest(state.getUsers, action)
        },

        /**
         * The GET request to /users succeeded.
         *
         * Payload should be an array of users.
         */
        completeGetUsers: function(state, action) {
            completeRequest(state.getUsers, action)

            action.payload.forEach(function(user) {
                state.users[user.id] = user
            })
        },

        // ========== POST /users =================

        /**
         * Start a POST request to /users to create a new user.  
         *
         * No payload.
         */
        requestPostUsers: function(state, action) {
            makeRequest(state.postUsers, action)
        },

        /**
         * A POST request to /users failed with an error at some point.
         *
         * Payload should be the error encountered or an array of errors.
         */
        failPostUsersWithError: function(state, action) {
            failRequest(state.postUsers, action)
        },
        /**
         * Get the result of a POST /users call and store it in the state.  In
         * this case, the call returns the posted user.  
         *
         * Payload will be a `user` object.
         */
        completePostUsers: function(state, action) {
            completeRequest(state.postUsers, action)

            const user = { ...state.postUsers.target }
            user.id = action.payload
            state.users[user.id] = user 
        },

        // ========== GET /user/:id =================

        /**
         * Start a GET request to /user/:id to retrieve a single user.  
         *
         * No payload.
         */
        requestGetUser: function(state, action) {
            makeRequest(state.getUser, action)
        },

        /**
         * A GET request to /user/:id failed with an error at some point.
         *
         * Payload should be the error encountered or an array of errors.
         */
        failGetUserWithError: function(state, action) {
            failRequest(state.getUser, action)
        },
        /**
         * Get the result of a GET /user/:id call and store it in the state.  In
         * this case, the call returns the requested user.  
         *
         * Payload will be a `user` object.
         */
        completeGetUser: function(state, action) {
            completeRequest(state.getUser, action)

            const user = action.payload
            state.users[user.id] = user 
        },

        // ========== PUT /user/:id =================

        /**
         * Start a PUT request to /user/:id to replace a single user.  
         *
         * No payload.
         */
        requestPutUser: function(state, action) {
            makeRequest(state.putUser, action)
        },

        /**
         * A PUT request to /user/:id failed with an error at some point.
         *
         * Payload should be the error encountered or an array of errors.
         */
        failPutUserWithError: function(state, action) {
            failRequest(state.putUser, action)
        },

        /**
         * Get the result of a PUT /user/:id call and store it in the state.  In
         * this case, the call returns the replaced user.  
         *
         * Payload will be a `user` object.
         */
        completePutUser: function(state, action) {
            completeRequest(state.putUser, action)

            const user = action.payload
            state.users[user.id] = user 
        },

        // ========== PUT /user/:id =================

        /**
         * Start a PUT request to /user/:id to replace a single user.  
         *
         * No payload.
         */
        requestPutUser: function(state, action) {
            makeRequest(state.putUser, action)
        },

        /**
         * A PUT request to /user/:id failed with an error at some point.
         *
         * Payload should be the error encountered or an array of errors.
         */
        failPutUserWithError: function(state, action) {
            failRequest(state.putUser, action)
        },

        /**
         * Get the result of a PUT /user/:id call and store it in the state.  In
         * this case, the call returns the replaced user.  
         *
         * Payload will be a `user` object.
         */
        completePutUser: function(state, action) {
            completeRequest(state.putUser, action)

            const user = action.payload
            state.users[user.id] = user 
        },

        // ========== PATCH /user/:id =================

        /**
         * Start a PATCH request to /user/:id to update a single user.  
         *
         * No payload.
         */
        requestPatchUser: function(state, action) {
            makeRequest(state.patchUser, action)
        },

        /**
         * A PATCH request to /user/:id failed with an error at some point.
         *
         * Payload should be the error encountered or an array of errors.
         */
        failPatchUserWithError: function(state, action) {
            failRequest(state.patchUser, action)
        },

        /**
         * Get the result of a PATCH /user/:id call and store it in the state.  In
         * this case, the call returns the updated user.  
         *
         * Payload will be a `user` object.
         */
        completePatchUser: function(state, action) {
            completeRequest(state.patchUser, action)

            const user = action.payload
            const newUser = {...state.users[user.id], ...user }
            state.users[user.id] = newUser 
        },


        // ========== DELETE /user/:id =================
        
        /**
         * Start a DELETE request to /user/:id to remove a single user.  
         *
         * No payload.
         */
        requestDeleteUser: function(state, action) {
            makeRequest(state.deleteUser, action)
        },

        /**
         * A DELETE request to /user/:id failed with an error at some point.
         *
         * Payload should be the error encountered or an array of errors.
         */
        failDeleteUserWithError: function(state, action) {
            failRequest(state.deleteUser, action)
        },

        /**
         * Finish the DELETE /user/:id call.  In this case, the call returns
         * the id of the deleted user and we need to delete them from state on
         * our side.  
         *
         * Payload will be the id of the deleted user.
         */
        completeDeleteUser: function(state, action) {
            completeRequest(state.deleteUser, action)
            delete state.users[action.payload]
        }
    }
})

/**
 * GET /users
 *
 * Get all users in the database.
 */
export const getUsers = function() {
    return async function(dispatch, getState) {
        dispatch(usersSlice.actions.requestGetUsers("users"))

        try {
            const response = await fetch(configuration.backend + '/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if ( response.ok ) {
                const users = await response.json()
                dispatch(usersSlice.actions.completeGetUsers(users))
            } else {
                dispatch(usersSlice.actions.failGetUsersWithError('GET /users failed with status ' + response.status))
            }
        } catch(error) {
            dispatch(usersSlice.actions.failGetUsersWithError(error.toString()))
        }
    }
}

/**
 * POST /users
 *
 * Create a new user.
 */
export const postUsers = function(user) {
    return async function(dispatch, getState) {
        dispatch(usersSlice.actions.requestPostUsers(user))
        try {
            const response = await fetch(configuration.backend + '/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            })
            if ( response.ok ) {
                const responseBody = await response.json()
                dispatch(usersSlice.actions.completePostUsers(responseBody.id))
            } else {
                dispatch(usersSlice.actions.failPostUsersWithError(response.status))
            }
        } catch (error) {
            console.log(error)
            dispatch(usersSlice.actions.failPostUsersWithError(error.toString()))
        }
    }
}

/**
 * GET /user/:id
 *
 * Get a single user.
 */
export const getUser = function(id) {
    return async function(dispatch, getState) {
        dispatch(usersSlice.actions.requestGetUser(id))
        try {
            const response = await fetch(configuration.backend + '/users/' + id, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if ( response.ok ) {
                const user = await response.json()
                dispatch(usersSlice.actions.completeGetUser(user))
            } else {
                dispatch(usersSlice.actions.failGetUserWithError('GET /user/' + id + ' failed with status ' + response.status))
            }
        } catch(error) {
            console.log(error)
            dispatch(usersSlice.actions.failGetUserWithError(error.toString()))
        }
    }
}

/**
 * PUT /user/:id
 *
 * Replace a user wholesale. 
 */
export const putUser = function(user) {
    return async function(dispatch, getState) {
        dispatch(usersSlice.actions.requestPutUser(user))
        try {
            const response = await fetch(configuration.backend + '/user/' + user.id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            })
            if ( response.ok ) {
                delete user.password
                dispatch(usersSlice.actions.completePutUser(user))
            } else {
                dispatch(usersSlice.actions.failPutUserWithError('PUT /user/' + user.id + ' failed with status ' + response.status))
            }
        } catch (error) {
            console.log(error)
            dispatch(usersSlice.actions.failPutUserWithError(error.toString()))
        }
    }
}

/**
 * PATCH /user/:id
 *
 * Update a user from a partial `user` object. 
 */
export const patchUser = function(user) {
    return async function(dispatch, getState) {
        dispatch(usersSlice.actions.requestPatchUser(user))
        try {
            const response = await fetch(configuration.backend + '/user/' + user.id, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            })
            if ( response.ok ) {
                delete user.password
                dispatch(usersSlice.actions.completePatchUser(user))
            } else {
                dispatch(usersSlice.actions.failPatchUserWithError('PATCH /user/' + user.id + ' failed with status ' + response.status))
            }
        } catch (error) {
            dispatch(usersSlice.actions.failPatchUserWithError(error.toString()))
        }
    }
}

/**
 * DELETE /user/:id
 *
 * Delete a user. 
 */
export const deleteUser = function(user) {
    return async function(dispatch, getState) {
        dispatch(usersSlice.actions.requestDeleteUser(id))
        try {
            const response = await fetch(configuration.backend + '/user/' + user.id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if ( response.ok ) {
                dispatch(usersSlice.actions.completeDeleteUser(user.id))
            } else {
                dispatch(usersSlice.actions.failDeleteUserWithError('DELETE /user/' + user.id + ' failed with status ' + response.status))
            }
        } catch (error) {
            dispatch(usersSlice.actions.failDeleteUserWithError(error.toString()))
        }
    }
}


export const {requestGetUsers, failGetUsersWithError, completeGetUsers,
                requestPostUsers, failPostUsersWithError, completePostUsers,
    requestGetUser, failGetUserWithError, completeGetUser,
    requestPutUser, failPutUserWithError, completePutUser,
    requestPatchUser, failPatchUserWithError, completePatchUser,
    requestDeleteUser, failDeleteUserWithError, completeDeleteUser}  = usersSlice.actions

export default usersSlice.reducer
