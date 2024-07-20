/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

import { createSlice } from '@reduxjs/toolkit'
import { stringify } from 'qs'

import { User, PartialUser } from '@danielbingham/peerreview-model'

import { AppDispatch, RootState } from '/state/store'

import {
    BaseSliceState,
    setInDictionary,
    removeEntity,
    makeQuery,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/libraries/state'
import { setRelationsInState } from '/libraries/relations'

import { RequestType, RequestMethod } from '/types/Request'
import { makeRequest } from '/state/requests'

import { setCurrentUser } from '/state/authentication'


/**
 * @see /libraries/state for explanation of Slice State structure.
 */
export interface UserSliceState extends BaseSliceState<User> { }
const initialState: UserSliceState = {
      dictionary: {},
      queries: {}
}

export const userSlice = createSlice({
    name: 'users',
    initialState: initialState,
    reducers: {
        setUsersInDictionary: setInDictionary<User, UserSliceState>,
        removeUser: removeEntity<User, UserSliceState>,
        makeUserQuery: makeQuery<User, UserSliceState>,
        setUserQueryResults: setQueryResults<User, UserSliceState>,
        clearUserQuery: clearQuery<User, UserSliceState>,
        clearUserQueries: clearQueries<User, UserSliceState>
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
export const getUsers = function(name: string, params: any) {
    return function(dispatch: AppDispatch): string {
        const queryString = stringify(params)
        const endpoint = '/users' + ( params ? '?' + queryString : '')

        dispatch(userSlice.actions.makeUserQuery({ name: name }))

        return dispatch(makeRequest(RequestType.User, RequestMethod.GET, endpoint, null,
            function(response) {
                dispatch(userSlice.actions.setUsersInDictionary({ dictionary: response.dictionary }))

                dispatch(userSlice.actions.setUserQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
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
export const postUsers = function(user: PartialUser) {
    return function(dispatch: AppDispatch): string {
        return dispatch(makeRequest(RequestType.User, RequestMethod.POST, '/users', user,
            function(response: any) {
                if ( ! ( "entity" in response) || ! ("relations" in response)) {
                    throw new Error('Unexpected response shape!')
                }

                dispatch(userSlice.actions.setUsersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
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
export const getUser = function(id: number) {
    return function(dispatch: AppDispatch, getState: () => RootState) {
        return dispatch(makeRequest(RequestType.User, RequestMethod.GET, `/user/${id}`, null,
            function(response) {
                dispatch(userSlice.actions.setUsersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))

                // If the user we just got is the same as the one in the session,
                // update the session.  The server will have already done this for
                // the backend, doubling the login on the frontend just saves us a
                // request.
                const state = getState()
                if ( state.authentication.currentUser && state.authentication.currentUser.id == response.entity.id) {
                    dispatch(setCurrentUser(response.entity))
                }
            }
        ))
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
export const patchUser = function(user: PartialUser) {
    return function(dispatch: AppDispatch, getState: () => RootState) {
        return dispatch(makeRequest(
            RequestType.User, RequestMethod.PATCH, 
            `/user/${user.id}`, user,
            function(response) {
                dispatch(userSlice.actions.setUsersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))

                // If the user we just got is the same as the one in the session,
                // update the session.  The server will have already done this for
                // the backend, doubling the login on the frontend just saves us a
                // request.
                const state = getState()
                if ( state.authentication.currentUser && state.authentication.currentUser.id == response.entity.id) {
                    dispatch(setCurrentUser(response.entity))
                }
            }
        ))
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
export const deleteUser = function(user: User) {
    return function(dispatch: AppDispatch) {
        return dispatch(makeRequest(
            RequestType.User, RequestMethod.DELETE, 
            `/user/${user.id}`, null,
            function(response) {
                dispatch(userSlice.actions.removeUser({ entity: response.entity }))
            }
        ))
    }
} 

export const { 
    setUsersInDictionary, removeUser, 
    makeUserQuery, setUserQueryResults, clearUserQuery,
}  = userSlice.actions

export default userSlice.reducer
