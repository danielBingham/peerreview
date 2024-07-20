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
import { v4 as uuidv4 } from 'uuid'
import { stringify } from 'qs'

import { AppDispatch, RootState } from '/state/store'
import logger from '/logger'

import { 
    RequestMethod,
    RequestType,
    RequestState,
    Request,
    RequestCacheMeta,

    RequestInitial,
    RequestFulfilled,
    RequestFailed,
    RequestCleaned
} from '/types/Request'

const defaultCacheTTL = 60 * 1000 // 1 minute 
const isStale = function(request: Request, overrideCacheTTL?: number) {
    const cacheTTL = overrideCacheTTL ? overrideCacheTTL : defaultCacheTTL
    return (Date.now() - request.timestamp) > cacheTTL
}

export interface RequestSliceState {
    requests: {
        [type: string] : {
            [id: string]: Request
        }
    }
    cacheMeta: {
        [id: string]: RequestCacheMeta
    }
}

const initialState: RequestSliceState = {
    requests: {},
    cacheMeta: {}
}

export const requestsSlice = createSlice({
    name: "requests",
    initialState: initialState,
    reducers: {

        /**
         * Create and cache a new request.
         */
        createRequest: function(state: RequestSliceState, action: PayloadAction<RequestInitial>) {
            const request = {
                type: action.payload.type,
                requestId: action.payload.requestId,
                method: action.payload.method,
                endpoint: action.payload.endpoint,
                timestamp: Date.now(),
                state: RequestState.Pending,
                error: null,
                errorData: {},
                status: null,
                result: null
            }
            state.requests[action.payload.type][action.payload.requestId] = request

            const cacheMeta = {
                uses: 1,
                cleaned: false,
                busted: false
            }

            state.cacheMeta[action.payload.requestId] = cacheMeta
        }, 

        /**
         * Fail a previously cached request. 
         */
        failRequest: function(state: RequestSliceState, action: PayloadAction<RequestFailed>) {
            const request = state.requests[action.payload.type][action.payload.requestId]
            if ( ! request ) {
                logger.warn(`Attempt to fail cached Request(${action.payload.requestId}) that doesn't exist.`)
                return
            }

            request.state = RequestState.Failed 
            request.status = action.payload.status

            if ( action.payload.error ) {
                request.error = action.payload.error
            } else {
                request.error = 'unknown'
            }

            if ( action.payload.errorData ) {
                request.errorData = action.payload.errorData
            }
        }, 

        /**
         * Complete a previously cached request.
         */
        completeRequest: function(state: RequestSliceState, action: PayloadAction<RequestFulfilled>) {
            const request = state.requests[action.payload.type][action.payload.requestId]
            if ( ! request ) {
                logger.warn(`Attempt to complete tracked Request(${action.payload.requestId}) that doesn't exist.`)
                return
            }

            request.state = RequestState.Fulfilled 
            request.status = action.payload.status
            request.result = action.payload.result
        },

        /**
         * Bust the request cache.
         */
        bustRequestCache: function(state: RequestSliceState, action: PayloadAction<RequestType>) {
            for ( const requestId in state.requests[action.payload] ) {
                state.cacheMeta[requestId].busted = true
            }
        },

        /**
         * Cleanup a cached request that we're done with.
         */
        cleanupRequest: function(state: RequestSliceState, action: PayloadAction<RequestCleaned>) {
            const request = state.requests[action.payload.type][action.payload.requestId]
            const cacheTTL = action.payload.cacheTTL
            const cacheMeta = state.cacheMeta[action.payload.requestId] 

            if ( ! request ) {
                logger.warn('Warning: attempt to cleanup request that does not exist: ' + action.payload.requestId)
                return
            }

            cacheMeta.uses -= 1
            // This request is still in use somewhere.  We're not ready to clean it
            // yet.
            if ( cacheMeta.uses > 0 ) {
                return
            }

            if ( isStale(request, cacheTTL) || cacheMeta.busted ) {
                delete state.requests[action.payload.requestId]
            } else {
                cacheMeta.cleaned = true 
            }
        }, 

        useRequest: function(state: RequestSliceState, action: PayloadAction<{ requestId: string }>) {
            const cacheMeta = state.cacheMeta[action.payload.requestId]

            cacheMeta.uses += 1
            cacheMeta.cleaned = false
        },

        /**
         * Collect cleaned or busted requests.
         */
        garbageCollectRequests: function(state: RequestSliceState, action: PayloadAction<{ type: RequestType, cacheTTL?: number }>) {
            const cacheTTL = action.payload.cacheTTL
            for ( const requestId in state.requests[action.payload.type] ) {
                const request = state.requests[action.payload.type][requestId]
                const cacheMeta = state.cacheMeta[requestId]

                // Only garbage collect requests that are both stale and have been
                // cleaned. This prevents us from collecting a request that's still in
                // use because its component hasn't unmounted yet.
                if ( cacheMeta.cleaned && (isStale(request, cacheTTL) || cacheMeta.busted)) {
                    delete state.requests[requestId]
                }
                // If the cacheTTL is set to zero, that means we don't want to track
                // requests at all.  Every time we garbage collect, mark them as busted
                // so that they won't be reused.
                else if ( cacheTTL == 0 ) {
                    cacheMeta.busted = true
                }
            }
        }
    }
})

export const getRequestFromCache = function(type: RequestType, method: RequestMethod, endpoint: string ) {
    return function(dispatch: AppDispatch, getState: () => RootState) {
        const state = getState().requests

        for ( const id in state.requests[type]) {
            const request = state.requests[type][id]
            const cacheMeta = state.cacheMeta[id]

            // It may not have been cleaned yet, because it's still in use, but
            // we still don't want to reuse it, because some other request
            // invalidated the data it contained.
            if ( cacheMeta.busted ) {
                continue
            }

            if ( request && request.method == method && request.endpoint == endpoint ) {
                if ( request.state == 'fulfilled' ) {
                    dispatch(requestsSlice.actions.useRequest({ requestId: id }))
                    return request
                } else {
                    return null
                }
            }
        }
        return null
    }
}

/**
 * Create a URLSearchParams object from an object of parameters.  Translates
 * things like arrays to the appropriate query string format.
 */
export const makeSearchParams = function(params: any): URLSearchParams {
    const queryString = new URLSearchParams()
    for ( const key in params ) {
        if ( Array.isArray(params[key]) ) {
            for ( const value of params[key] ) {
                queryString.append(key+'[]', value)
            }
        } else {
            queryString.append(key, params[key])
        }
    }
    return queryString
}


interface FetchOptions {
    method: string
    headers: { [header: string]: string }
    body?: any
}

/**
 * Make a request to an API endpoint.  Manages tracking the request, reusing
 * from the cache, and handling any errors.
 *  
 * Provides an `onSuccess` method, which will be called when the request
 * succeeds.  Errors are recorded on the request request object, which can be
 * retrieved from the provided Redux slice's `requests` dictionary using the
 * returned `requestId`.
 *
 * @param {RequestType} type    The RequestType of request we want to make.
 * @param {string} method       The HTTP verb to use as the request method (eg.
 * GET, POST, etc)
 * @param {string} endpoint     The endpoint we want to make a request to.
 * @param {function} onSuccess  A function to be called with the response's
 * body, parsed from JSON to a js object.
 *
 * @return {uuid}   A requestId that can be used to retrieve the request
 * request from the `slice`.  It will be stored in the `requests` object keyed
 * by the `requestId`, and can be found at `state.<slice-name>.requests[requestId]`
 */
export const makeRequest = function(
    type: RequestType, 
    method: RequestMethod, 
    endpoint: string, 
    body: any, 
    onSuccess: (responseBody: any) => void, 
    onFailure?: (responseBody: any) => void
) {
    return function(dispatch: AppDispatch, getState: () => RootState): string {
        const configuration = getState().system.configuration

        // Cleanup dead requests before making a new one.
        dispatch(requestsSlice.actions.garbageCollectRequests({ type: type }))

        if ( method == RequestMethod.GET ) {
            const request = dispatch(getRequestFromCache(type, method, endpoint))
            if ( request ) {
                onSuccess(request.result)
                return request.requestId
            }
        } else {
            dispatch(requestsSlice.actions.bustRequestCache(type))
        }

        const requestId = uuidv4()
        let status = 0
        let responseOk = false

        const fetchOptions: FetchOptions = {
            method: method,
            headers: {
                'Accept': 'application/json'
            }
        }

        if (method == RequestMethod.POST 
                || method == RequestMethod.PUT || method == RequestMethod.PATCH ) {
            if ( body && body instanceof FormData ) {
                fetchOptions.body = body
            } else if ( body ) {
                fetchOptions.body = JSON.stringify(body)
                fetchOptions.headers['Content-Type'] = 'application/json'
            }
        }

        let fullEndpoint = ''
        // System slice requests need to go to the root, rather than the API
        // backend.  These requests include querying for the configuration that
        // contains the API backend itself, as well as for feature flags.
        if ( type == RequestType.system) {
            fullEndpoint = endpoint
        } else if (configuration == null ) {
            // If we're querying from anything other than the system slice before
            // we've got our configuration, then we have an error.
            throw new Error('Attempting to query from the API before the configuration is set!')
        } else {
            fullEndpoint = configuration.backend + endpoint
        }


        // ======== Make the Request ===========================================
        dispatch(
            requestsSlice.actions.createRequest({
                type: type, 
                requestId: requestId, 
                method: method, 
                endpoint: endpoint
            })
        )

        fetch(fullEndpoint, fetchOptions)

        // ======== Get the response body and status ===========================
        .then(function(response) {
            status = response.status
            responseOk = response.ok
            return response.json()
        })
        
        // ======== Process the response body ==================================
        .then(function(responseBody) {
            // If the request doesn't exist, then bail out before completing
            // `onSuccess`.  This means it has already been cleaned up, and its
            // results are probably invalid.
            //
            // In any case, there's nothing to complete and nothing to fail.
            const state = getState().requests
            if( ! state.requests[type][requestId] ) {
                return Promise.resolve()
            }

            // ======== Successful Request =====================================
            if ( responseOk ) {
                if ( onSuccess ) {
                    try {
                        onSuccess(responseBody)
                    } catch (error) {
                        return Promise.reject(error)
                    }
                }

                dispatch(
                    requestsSlice.actions.completeRequest({ 
                        type: type, 
                        requestId: requestId, 
                        status: status, 
                        result: responseBody 
                    })
                )
            } 

            // ======== Failed  Request =======================================
            else {
                dispatch(
                    requestsSlice.actions.failRequest({ 
                        type: type, 
                        requestId: requestId, 
                        status: status, 
                        error: responseBody.error, 
                        errorData: responseBody.data 
                    })
                )

                if ( onFailure ) {
                    try {
                        onFailure(responseBody)
                    } catch (error) {
                        return Promise.reject(error)
                    }
                }
            }

            return Promise.resolve()
        }).catch(function(error) {
            logger.error(error)
            dispatch(
                requestsSlice.actions.failRequest({ 
                    type: type, 
                    requestId: requestId, 
                    status: status, 
                    error: 'frontend-request-error' 
                })
            )
        })

        return requestId
    }
}

export const { cleanupRequest } = requestsSlice.actions 

export default requestsSlice.reducer 
