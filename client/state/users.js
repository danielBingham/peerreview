import { createSlice, current } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import logger from '/logger'

import { 
    makeSearchParams,
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    bustRequestCache,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

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
        list: [],

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In this case: GET /users 
         *
         * Structure:
         * {
         *  queryName: {
         *      meta: {
         *          page: <int>,
         *          count: <int>,
         *          pageSize: <int>,
         *          numberOfPages: <int>
         *      },
         *      list: [] 
         *  },
         *  ...
         * }
         */
        queries: {}
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

        makeQuery: function(state, action) {
            const name = action.payload.name

            state.queries[name] = {
                meta: {
                    page: 1,
                    count: 0,
                    pageSize: 1,
                    numberOfPages: 1
                },
                result: [] 
            }
        },

        setQueryResults: function(state, action) {
            const name = action.payload.name
            const meta = action.payload.meta
            const result = action.payload.result

            state.queries[name].meta = meta
            state.queries[name].result = result
        },

        clearQuery: function(state, action) {
            const name = action.payload.name

            if ( state.queries[name] ) {
                delete state.queries[name]
            }
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


        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useRequest,
        bustRequestCache: bustRequestCache,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
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
export const getUsers = function(name, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params)
        const endpoint = '/users' + ( params ? '?' + queryString.toString() : '')

        dispatch(usersSlice.actions.makeQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, usersSlice,
            'GET', endpoint, null,
            function(responseBody) {
                const resultIds = []
                if ( responseBody.result.length > 0) {
                    for(const user of responseBody.result ) {
                        resultIds.push(user.id)
                        dispatch(usersSlice.actions.addUsersToDictionary(user))
                    }
                }
                dispatch(usersSlice.actions.setQueryResults({
                    name: name,
                    meta: responseBody.meta,
                    result: resultIds
                }))
            }
        )
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
        dispatch(usersSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, usersSlice,
            'POST', '/users', user,
            function(returnedUser) {
                dispatch(usersSlice.actions.addUsersToDictionary(returnedUser))
            }
        )
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
        return makeTrackedRequest(dispatch, getState, usersSlice,
            'GET', `/user/${id}`, null,
            function(user) {
                dispatch(usersSlice.actions.addUsersToDictionary(user))
            }
        )
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
        dispatch(usersSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, usersSlice,
            'PUT', `/user/${user.id}`, user,
            function(returnedUser) {
                dispatch(usersSlice.actions.addUsersToDictionary(returnedUser))

                // If the user we just got is the same as the one in the session,
                // update the session.  The server will have already done this for
                // the backend, doubling the login on the frontend just saves us a
                // request.
                const state = getState()
                if ( state.authentication.currentUser && state.authentication.currentUser.id == returnedUser.id) {
                    dispatch(setCurrentUser(returnedUser))
                }

            }
        )
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
        dispatch(usersSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, usersSlice,
            'PATCH', `/user/${user.id}`, user,
            function(returnedUser) {
                dispatch(usersSlice.actions.addUsersToDictionary(returnedUser))

                // If the user we just got is the same as the one in the session,
                // update the session.  The server will have already done this for
                // the backend, doubling the login on the frontend just saves us a
                // request.
                const state = getState()
                if ( state.authentication.currentUser && state.authentication.currentUser.id == returnedUser.id) {
                    dispatch(setCurrentUser(returnedUser))
                }

            }
        )
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
        dispatch(usersSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, usersSlice,
            'DELETE', `/user/${user.id}`, null,
            function(responseBody) {
                dispatch(usersSlice.actions.removeUser(user))
            }
        )
    }
} 

export const { 
    addUsersToDictionary, appendUsersToList, clearList, removeUser, 
    clearQuery, cleanupRequest 
}  = usersSlice.actions

export default usersSlice.reducer
