import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from './config'

import RequestTracker from './requestTracker'


/**
 * TODO
 *
 * We don't want the redux state to get out of sync with the database. Issues we need to resolve:
 * - We could be sending multiple requests at once.  Potentially even multiple copies of the same request on the same
 *   resource.  We should track requests in progress against a resource.
 * - We should get the resulting state of resource in the database back from
 *   every request so that we can set that in state.
 *
 */
export const usersSlice = createSlice({
    name: 'users',
    initialState: {
        requests: {},
        users: {},
    },
    reducers: {
        // ========== GET /users ==================

        /**
         * Start a GET request to /users.
         *
         * Payload should be an object with:
         *  requestId: a uuid
         */
        requestGetUsers: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker('GET', 'users') 
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * The GET request to /users succeeded.
         *
         * Payload should be an object with:
         *     requestId: a uuid
         *     users: an array of populated user objects
         */
        completeGetUsers: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            action.payload.users.forEach(function(user) {
                state.users[user.id] = user
            })
        },

        // ========== POST /users =================

        /**
         * Start a POST request to /users to create a new user.  
         *
         * Payload should be an object with:
         *  requestId: a uuid
         */
        requestPostUsers: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker('POST', 'users')
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Get the result of a POST /users call and store it in the state.  In
         * this case, the call returns the posted user.  
         *
         * Payload should be an object with:
         *  requestId: a uuid
         *  user: a populated user object
         */
        completePostUsers: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            state.users[user.id] = action.payload.user 
        },

        // ========== GET /user/:id =================

        /**
         * Start a GET request to /user/:id to retrieve a single user.  
         *
         * Payload should be an object with:
         *  requestId: uuid
         */
        requestGetUser: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker('GET', 'user')
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Get the result of a GET /user/:id call and store it in the state.  In
         * this case, the call returns the requested user.  
         *
         * Payload should be an object with:
         *  requestId: uuid
         *  user: a populated user object
         */
        completeGetUser: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            const user = action.payload.user
            state.users[user.id] = user 
        },

        // ========== PUT /user/:id =================

        /**
         * Start a PUT request to /user/:id to replace a single user.  
         *
         * Payload should be an object with:
         *  requestId: uuid
         */
        requestPutUser: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker('PUT', 'user')
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Get the result of a PUT /user/:id call and store it in the state.  In
         * this case, the call returns the replaced user.  
         *
         * Payload should be an object with:
         *  requestId: uuid
         *  user: a populated user object
         */
        completePutUser: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            const user = action.payload.user
            state.users[user.id] = user 
        },

        // ========== PATCH /user/:id =================

        /**
         * Start a PATCH request to /user/:id to update a single user.  
         *
         * Payload should be an object with:
         *  requestId: uuid
         */
        requestPatchUser: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker('PATCH', 'user')
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Get the result of a PATCH /user/:id call and store it in the state.  In
         * this case, the call returns the updated user.  
         *
         * Payload will be an object with:
         *  requestId: uuid
         *  user: a populated user object
         */
        completePatchUser: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            const user = action.payload.user
            state.users[user.id] = user 
        },


        // ========== DELETE /user/:id =================
        
        /**
         * Start a DELETE request to /user/:id to remove a single user.  
         *
         * Payload will be an object with:
         *  requestId: uuid
         */
        requestDeleteUser: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker('DELETE', 'user')
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Finish the DELETE /user/:id call.  In this case, the call returns
         * the id of the deleted user and we need to delete them from state on
         * our side.  
         *
         * Payload will be an object with:
         *  requestId: uuid
         *  userId: id of the deleted user
         */
        completeDeleteUser: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
            delete state.users[action.payload.userId]
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

/**
 * GET /users
 *
 * Get all users in the database.
 */
export const getUsers = function() {
    return function(dispatch, getState) {
        const requestId = uuidv4() 
        dispatch(usersSlice.actions.requestGetUsers({responseId: requestId}))

        fetch(configuration.backend + '/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject({status: response.status})
            }
        }).then(function(users) {
            dispatch(usersSlice.actions.completeGetUsers({requestId: requestId, users: users}))
        }).catch(function(error) {
            if (error instanceof Error) {
                console.log(error)
                dispatch(usersSlice.actions.failRequest({requestId: requestId, error: error.toString()}))
            } else if( error.status ) {
                dispatch(usersSlice.actions.failRequest({requestId: requestId, status: error.status, error: ''}))
            } else {
                console.log(error)
                dispatch(usersSlice.actions.failRequest({requestId: requestId, error: 'unknown'}))
            }
        })
        return requestId
    }
}

/**
 * POST /users
 *
 * Create a new user.
 */
export const postUsers = function(user) {
    return async function(dispatch, getState) {
        const requestId = uuidv4()
        dispatch(usersSlice.actions.requestPostUsers({requestId:requestId}))
        fetch(configuration.backend + '/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        }).then(function(response) {
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject({status: response.status})
            }
        }).then(function(user) {
            dispatch(usersSlice.actions.completePostUsers(user))
        }).catch(function(error) {
            if ( error instanceof Error) {
                console.log(error)
                dispatch(usersSlice.actions.failRequest({requestId: requestId, error: error.toString()}))
            } else if (error.status) {
                dispatch(usersSlice.actions.failRequest({requestId: requestId, status: error.status, error: ''}))
            } else {
                console.log(error)
                dispatch(usersSlice.actions.failRequest({requestId: requestId, error: 'unknown'}))
            }
        })
        return requestId
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
                dispatch(usersSlice.actions.failRequest('GET /user/' + id + ' failed with status ' + response.status))
            }
        } catch(error) {
            console.log(error)
            dispatch(usersSlice.actions.failRequest(error.toString()))
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
                dispatch(usersSlice.actions.failRequest('PUT /user/' + user.id + ' failed with status ' + response.status))
            }
        } catch (error) {
            console.log(error)
            dispatch(usersSlice.actions.failRequest(error.toString()))
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
                dispatch(usersSlice.actions.failRequest('PATCH /user/' + user.id + ' failed with status ' + response.status))
            }
        } catch (error) {
            dispatch(usersSlice.actions.failRequest(error.toString()))
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
                dispatch(usersSlice.actions.failRequest('DELETE /user/' + user.id + ' failed with status ' + response.status))
            }
        } catch (error) {
            dispatch(usersSlice.actions.failRequest(error.toString()))
        }
    }
} 


export const {requestGetUsers,  completeGetUsers,
                requestPostUsers,  completePostUsers,
        requestGetUser,  completeGetUser,
    requestPutUser,  completePutUser,
    requestPatchUser,  completePatchUser,
    requestDeleteUser,  completeDeleteUser,
    failRequest, cleanupRequest }  = usersSlice.actions

export default usersSlice.reducer
