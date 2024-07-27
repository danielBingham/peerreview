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
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Feature, PartialFeature } from '@danielbingham/peerreview-features'

import { RequestType, RequestMethod } from '/types/Request'

import { AppDispatch } from '/state/store'
import { makeRequest } from '/state/foundation/Request'

interface FeatureSliceState {
    dictionary: {
        [name: string]: Feature
    }
}
const initialState: FeatureSliceState = {
    dictionary: {}
}

export const featureSlice = createSlice({
    name: 'features',
    initialState: initialState,
    reducers: {

        /**
         * Replace the whole dictionary.  
         *
         * @param {Object}  state   The redux state slice.
         * @param {Object}  action  The redux action.
         * @param {Object}  action.payload  The dictionary of features we got
         * from the backend.
         */ 
        setDictionary: function(state: FeatureSliceState, action: PayloadAction<{ [name: string]: Feature }>) {
            state.dictionary = action.payload
        },

        /**
         * Set a single item in the dictionary.
         *
         * @param {Object}  state   The redux state slice.
         * @param {Object}  action  The redux action.
         * @param {Object}  action.payload  The feature object to add to the
         * dictionary, overriding any set on its `name` key.
         */
        setInDictionary: function(state: FeatureSliceState, action: PayloadAction<Feature>) {
            state.dictionary[action.payload.name] = action.payload
        }
    }

})

/**
 * GET /features
 *
 * Get a dictionary containing all the features visible to this user.  Fully
 * popoulates state.features.dictionary
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const getFeatures = function() {
    return function(dispatch: AppDispatch) {
        const endpoint = '/features'

        return dispatch(makeRequest(
            RequestType.Feature, RequestMethod.GET, 
            endpoint, null,
            function(responseBody) {
                dispatch(featureSlice.actions.setDictionary(responseBody))
            }
        ))
    }
}

/**
 * POST /features
 *
 * Insert and initialize a feature.
 *
 * @param {Object}  feature The feature we want to initialize.  At a minimum
 * feature.name must be set.
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const postFeatures = function(feature: PartialFeature) {
    return function(dispatch: AppDispatch ) {
        const endpoint = '/features'

        return dispatch(makeRequest(
            RequestType.Feature, RequestMethod.POST,
            endpoint, feature,
            function(responseBody) {
                dispatch(featureSlice.actions.setInDictionary(responseBody))
            }
        ))
    }
}

/**
 * GET /feature/:id
 *
 * Get a feature.
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const getFeature = function(name: string) {
    return function(dispatch: AppDispatch ) {
        const endpoint = `/feature/${name}`

        return dispatch(makeRequest(
            RequestType.Feature, RequestMethod.GET,
            endpoint, null,
            function(responseBody) {
                dispatch(featureSlice.actions.setInDictionary(responseBody))
            }
        ))
    }
}

/**
 * PATCH /feature/:feature.entity.id
 *
 * Update a feature with partial data.
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const patchFeature = function(feature: PartialFeature) {
    return function(dispatch: AppDispatch) {
        const endpoint = `/feature/${feature.name}`

        return dispatch(makeRequest(
            RequestType.Feature, RequestMethod.PATCH, 
            endpoint, feature,
            function(responseBody) {
                dispatch(featureSlice.actions.setInDictionary(responseBody))
            }
        ))
    }
}

export default featureSlice.reducer
