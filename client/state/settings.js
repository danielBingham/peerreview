import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import logger from '/logger'

import { 
    makeTrackedRequest,
    makeSearchParams,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

import { setSettings } from '/state/authentication'

export const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of settings we've retrieved from the backend, keyed by
         * setting.id.
         *
         * @type {object}
         */
        dictionary: {}

    },
    reducers: {

        /**
         * Add one or more settings to the setting state.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object|object[]} action.payload - The payload sent with the
         * action, must either be an array of settings or a setting.
         */
        addSettingsToDictionary: function(state, action) {
            if (Array.isArray(action.payload)) {
                for(const setting of action.payload) {
                    state.dictionary[setting.userId] = setting
                }
            } else if( action.payload.id ) {
                const setting = action.payload
                state.dictionary[setting.userId] = setting 
            } else {
                throw new TypeError('Payload must be an array of settings or a setting.')
            }
        },

        /**
         * Remove a setting from both the dictionary and the list.
         *
         * @param {object} state    The redux state slice.
         * @param {object} action   The action we're reducing.
         * @param {object} action.payload   A setting object.  The one we want to remove.
         */
        removeSetting: function(state, action) {
            const setting = action.payload
            delete state.dictionary[setting.userId]
        },

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useRequest,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})

/**
 * GET /user/:user_id/settings
 *
 * Get all settings in the database for a user. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getSettings = function(userId) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, settingsSlice,
            'GET', `/user/${userId}/settings`, null,
            function(settings) {
                dispatch(settingsSlice.actions.addSettingsToDictionary(settings))
            }
        )
    }
}

/**
 * POST /user/:user_id/settings
 *
 * Create a new setting.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} setting - A populated setting object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postSettings = function(setting) {
    return function(dispatch, getState) {

        // TODO this needs a comment. What the hell was I doing here?  I bet it
        // has to do with the difference in setting settings when we have an
        // authenticated user and when we're just setting them on the session
        // with no authenticated user.
        let endpoint = ''
        if ( setting.userId ) {
            endpoint = `/user/${setting.userId}/settings`
        } else {
            endpoint = '/settings'
        }

        return makeTrackedRequest(dispatch, getState, settingsSlice,
            'POST', endpoint, setting,
            function(returnedSetting) {
                const state = getState()
                if ( state.authentication.currentUser) {
                    dispatch(settingsSlice.actions.addSettingsToDictionary(returnedSetting))
                } else {
                    dispatch(setSettings(returnedSetting))
                }
            }
        )
    }
}

/**
 * GET /setting/:id
 *
 * Get a single setting.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the setting we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getSetting = function(userId, id) {
    return function(dispatch, getState) {
        const endpoint = `/user/${userId}/setting/${id}`
        return makeTrackedRequest(dispatch, getState, settingsSlice,
            'GET', endpoint, null,
            function(setting) {
                dispatch(settingsSlice.actions.addSettingsToDictionary(setting))
            }
        )
    }
}

/**
 * PUT /user/:user_id/setting/:id
 *
 * Replace a setting wholesale. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} setting - A populated setting object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const putSetting = function(setting) {
    return function(dispatch, getState) {
        const endpoint = `/user/${setting.id}/setting/${setting.id}`
        return makeTrackedRequest(dispatch, getState, settingsSlice,
            'PUT', endpoint, setting,
            function(returnedSetting) {
                dispatch(settingsSlice.actions.addSettingsToDictionary(returnedSetting))

                // Only the current user can patch their own settings.  So we
                // need to update the settings on authentication as well.
                dispatch(setSettings(returnedSetting))
            }
        )
    }
}

/**
 * PATCH /user/:user_id/setting/:id
 *
 * Update a setting from a partial `setting` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} setting - A populate setting object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchSetting = function(setting) {
    return function(dispatch, getState) {
        const endpoint = `/user/${setting.userId}/setting/${setting.id}` 
        return makeTrackedRequest(dispatch, getState, settingsSlice,
            'PATCH', endpoint, setting,
            function(returnedSetting) {
                dispatch(settingsSlice.actions.addSettingsToDictionary(returnedSetting))

                // Only the current user can patch their own settings.  So we
                // need to update the settings on authentication as well.
                dispatch(setSettings(returnedSetting))
            }
        )
    }
}

/**
 * DELETE /user/:user_id/setting/:id
 *
 * Delete a setting. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} setting - A populated setting object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteSetting = function(setting) {
    return function(dispatch, getState) {
        const endpoint = `/user/${setting.userId}/setting/${setting.id}`
        return makeTrackedRequest(dispatch, getState, settingsSlice,
            'DELETE', endpoint, null,
            function(response) {
                dispatch(settingsSlice.actions.removeSetting(setting))
            }
        )
    }
} 

export const { addSettingsToDictionary, removeSetting, makeRequest, failRequest, completeRequest, cleanupRequest }  = settingsSlice.actions

export default settingsSlice.reducer
