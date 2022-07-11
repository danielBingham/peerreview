import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '/configuration'
import logger from '/logger'

import RequestTracker from './helpers/requestTracker'

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
            console.log(action.payload)
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


        // ========== Generic Request Methods =============
        // Use these methods when no extra logic is needed.  If additional
        // logic is needed for a particular request, make a reducer of the form
        // [make/fail/complete/cleanup][method][endpoint]Request().  For
        // example, makePostSettingsRequest().  The reducer should take an object
        // with at least requestId defined, along with whatever all inputs it
        // needs.

        /**
         * Make a request to a setting or settings endpoint.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {string} action.payload.method - One of the HTTP verbs
         * @param {string} action.payload.endpoint - The endpoint we're making the request to
         */
        makeRequest: function(state, action) {
            state.requests[action.payload.requestId] = RequestTracker.getRequestTracker(action.payload.method, action.payload.endpoint)
            RequestTracker.makeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Fail a request to a setting or settings endpoint, usually with an error.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {int} action.payload.status - (Optional) The status code returned with the response.
         * @param {string} action.payload.error - (Optional) A string error message.
         */
        failRequest: function(state, action) {
            RequestTracker.failRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Complete a request to a setting or settings endpoint by setting the setting
         * sent back by the backend in the settings hash.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.setting - A populated setting object, must have `id` defined
         */
        completeRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
        },

        /**
         * Cleanup a request by removing it from our request hash.  Once we're
         * done with a request, we don't need to keep its tracking around.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         */
        cleanupRequest: function(state, action) {
            delete state.requests[action.payload.requestId]
        }
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

        const requestId = uuidv4() 
        const endpoint = `/user/${userId}/settings`

        let payload = {
            requestId: requestId
        }


        dispatch(settingsSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(settings) {
            dispatch(settingsSlice.actions.addSettingsToDictionary(settings))

            payload.result = settings
            dispatch(settingsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(settingsSlice.actions.failRequest(payload))
        })

        return requestId
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

        const requestId = uuidv4()
        let endpoint = ''
        if ( setting.userId ) {
            endpoint = `/user/${setting.userId}/settings`
        } else {
            endpoint = '/settings'
        }

        const payload = {
            requestId: requestId
        }

        dispatch(settingsSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(setting)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedSetting) {
            const state = getState()
            if ( state.authentication.currentUser) {
                dispatch(settingsSlice.actions.addSettingsToDictionary(returnedSetting))
            } else {
                dispatch(setSettings(returnedSetting))
            }

            payload.result = returnedSetting
            dispatch(settingsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(settingsSlice.actions.failRequest(payload))
        })

        return requestId
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

        const requestId = uuidv4()
        const endpoint = `/user/${userId}/setting/${id}`

        const payload = {
            requestId: requestId
        }

        dispatch(settingsSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(setting) {
            dispatch(settingsSlice.actions.addSettingsToDictionary(setting))

            payload.result = setting
            dispatch(settingsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(settingsSlice.actions.failRequest(payload))
        })

        return requestId
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
    
        const requestId = uuidv4()
        const endpoint = `/user/${setting.id}/setting/${setting.id}`

        const payload = {
            requestId: requestId
        }

        dispatch(settingsSlice.actions.makeRequest({requestId: requestId, method: 'PUT', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(setting)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()

            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }

        }).then(function(returnedSetting) {
            dispatch(settingsSlice.actions.addSettingsToDictionary(returnedSetting))
            dispatch(setSettings(returnedSetting))

            payload.result = returnedSetting
            dispatch(settingsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(settingsSlice.actions.failRequest(payload))
        })

        return requestId
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

        const requestId = uuidv4()
        const endpoint = `/user/${setting.userId}/setting/${setting.id}` 

        const payload = {
            requestId: requestId
        }

        dispatch(settingsSlice.actions.makeRequest({requestId: requestId, method: 'PATCH', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(setting)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedSetting) {
            dispatch(settingsSlice.actions.addSettingsToDictionary(returnedSetting))
            dispatch(setSettings(returnedSetting))

            payload.result = returnedSetting
            dispatch(settingsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(settingsSlice.actions.failRequest(payload))
        })

        return requestId
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

        const requestId = uuidv4()
        const endpoint = `/user/${setting.userId}/setting/${setting.id}`

        const payload = {
            requestId: requestId,
            result: setting.id
        }
        
        dispatch(settingsSlice.actions.makeRequest({requestId: requestId, method: 'DELETE', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if( response.ok ) {
                dispatch(settingsSlice.actions.removeSetting(setting))
                dispatch(settingsSlice.actions.completeRequest(payload))
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
            dispatch(settingsSlice.actions.failRequest(payload))
        })

        return requestId
    }
} 

export const { addSettingsToDictionary, removeSetting, makeRequest, failRequest, completeRequest, cleanupRequest }  = settingsSlice.actions

export default settingsSlice.reducer
