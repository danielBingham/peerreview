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
import { v4 as uuidv4 } from 'uuid'

import setRelationsInState from './helpers/relations'

import {
    setInDictionary,
    removeEntity,
    makeQuery,
    setQueryResults,
    clearQuery,
    clearQueries
} from './helpers/state'

import { 
    makeSearchParams,
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    bustRequestCache,
    useRequest as useTrackedRequest,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

const cacheTTL = 0  // Don't cache paper notifications.  We poll for them. 

export const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of notifications we've retrieved from the backend, keyed by
         * notification.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
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
        queries: {},

        // ======== Specific State ============================================

    },
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setNotificationsInDictionary: setInDictionary,
        removeNotification: removeEntity,
        makeNotificationQuery: makeQuery,
        setNotificationQueryResults: setQueryResults,
        clearNotificationQuery: clearQuery,
        clearNotificationQueries: clearQueries,

        // ======== State Specific Manipulation Helpers ====

        appendToQuery: function(state, action) {
            const name = action.payload.name
            const list = action.payload.list

            state.queries[name].list = [ ...state.queries[name].list, ...list ]
        },

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useTrackedRequest,
        bustRequestCache: bustRequestCache,
        cleanupRequest: function(state, action) {
            action.payload.cacheTTL = cacheTTL
            cleanupTrackedRequest(state, action)
        }, 
        garbageCollectRequests: function(state, action) {
            action.payload = cacheTTL
            garbageCollectTrackedRequests(state, action)
        }
    }
})


/**
 * GET /notifications
 *
 * Get all notifications in the database.  Populates state.notifications.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getNotifications = function(name, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params) 
        const endpoint = `/notifications${( params ? '?' + queryString.toString() : '')}`

        const state = getState()
        if ( ! state.notifications.queries[name] ) {
            dispatch(notificationsSlice.actions.makeNotificationQuery({ name: name }))
        }

        return makeTrackedRequest(dispatch, getState, notificationsSlice,
            'GET', endpoint, null,
            function(response) {
                if ( ! params?.since ) {
                    dispatch(notificationsSlice.actions.setNotificationsInDictionary({ dictionary: response.dictionary}))

                    dispatch(notificationsSlice.actions.setNotificationQueryResults({ name: name, meta: response.meta, list: response.list }))
                } else {
                    if ( response.list.length > 0 ) {
                        dispatch(notificationsSlice.actions.setNotificationsInDictionary({ dictionary: response.dictionary}))

                        dispatch(notificationsSlice.actions.appendToQuery({ name: name, list: response.list }))
                    }
                }

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /notifications
 *
 * Update a batch of notifications from a partial `notification` object.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object[]} notifications - A populate notification object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchNotifications = function(notifications) {
    return function(dispatch, getState) {
        dispatch(notificationsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, notificationsSlice,
            'PATCH', `/notifications`, notifications,
            function(response) {
                dispatch(notificationsSlice.actions.setNotificationsInDictionary({ dictionary: response.dictionary }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }

}

/**
 * PATCH /notification/:id
 *
 * Update a notification from a partial `notification` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} notification - A populate notification object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchNotification = function(notification) {
    return function(dispatch, getState) {
        dispatch(notificationsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, notificationsSlice,
            'PATCH', `/notification/${notification.id}`, notification,
            function(response) {
                dispatch(notificationsSlice.actions.setNotificationsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

export const {  
    setNotificationsInDictionary, removeNotification,
    makeNotificationQuery, setNotificationQueryResults, clearNotificationQuery,
    cleanupRequest   
}  = notificationsSlice.actions

export default notificationsSlice.reducer
