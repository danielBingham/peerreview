import { v4 as uuidv4 } from 'uuid'
import logger from '/logger'

const defaultCacheTTL = 60 * 1000 // 1 minute 
const isStale = function(tracker, overrideCacheTTL) {
    const cacheTTL = overrideCacheTTL ? overrideCacheTTL : defaultCacheTTL
    return (Date.now() - tracker.timestamp) > cacheTTL
}

/**
 * Create a new RequstTracker object.  Will be stored in Redux so needs to be
 * serializable.
 */
const createRequestTracker = function(requestId, method, endpoint) {
    return {
        requestId: requestId,
        method: method,
        endpoint: endpoint,
        timestamp: Date.now(),
        uses: 1,
        cleaned: false,
        cacheBusted: false,
        state: 'pending',
        error: null,
        errorData: {},
        status: null,
        result: null
    }
}

/******************************************************************************
 *
 * ============ Redux Request Tracking Reducers ==============================
 *
 * These are a set of reducers that may be imported into a Redux State slice
 * to provide that slice with request tracking.  These reducers must be set
 * on the slice's `reducers` object in the object passed to `createSlice()` in
 * order to use `requestEndpoint` defined below.
 *
 * ****************************************************************************/

/**
 * Create a RequestTracker and begin tracking.
 */
export const makeRequest = function(state, action) {
    const tracker = createRequestTracker(action.payload.requestId, action.payload.method, action.payload.endpoint) 
    state.requests[action.payload.requestId] = tracker
}
export const startRequestTracking = makeRequest

/**
 * Record a failed request.
 */
export const failRequest = function(state, action) {
    const tracker = state.requests[action.payload.requestId]
    if ( ! tracker ) {
        logger.warn(`Attempt to fail tracked Request(${action.payload.requestId}) that doesn't exist.`)
        return
    }

    
    tracker.state = 'failed'
    tracker.status = action.payload.status

    if ( action.payload.error ) {
        tracker.error = action.payload.error
    } else {
        tracker.error = 'unknown'
    }

    if ( action.payload.errorData ) {
        tracker.errorData = action.payload.errorData
    }
}
export const recordRequestFailure = failRequest

/**
 * Record a successful request.
 */
export const completeRequest = function(state, action) {
    const tracker = state.requests[action.payload.requestId]
    if ( ! tracker ) {
        logger.warn(`Attempt to complete tracked Request(${action.payload.requestId}) that doesn't exist.`)
        return
    }

    tracker.state = 'fulfilled'
    tracker.status = action.payload.status
    tracker.result = action.payload.result
}
export const recordRequestSuccess = completeRequest

/**
 * Reuse a cleanup request.
 */
export const useRequest = function(state, action) {
    const tracker = state.requests[action.payload.requestId]
    tracker.uses += 1
    tracker.cleaned = false
}

/**
 * Cleanup a request tracker that we're done with.
 */
export const cleanupRequest = function(state, action) {
    const tracker = state.requests[action.payload.requestId]
    const cacheTTL = action.payload.cacheTTL

    if ( ! tracker ) {
        logger.warn('Warning: attempt to cleanup request that does not exist: ' + action.payload.requestId)
        return
    }

    tracker.uses -= 1
    // This tracker is still in use somewhere.  We're not ready to clean it
    // yet.
    if ( tracker.uses > 0 ) {
        return
    }

    if ( isStale(tracker, cacheTTL) || tracker.cacheBusted ) {
        delete state.requests[action.payload.requestId]
    } else {
        tracker.cleaned = true
    }
}

/**
 * Garbage collect cleaned requests.  We don't want to wipe them out
 * immediately, because we might reuse them in the future.  So we clean them up
 * whenever a new request is made for that slice.
 */
export const garbageCollectRequests = function(state, action) {
    const cacheTTL = action.payload
    for ( const requestId in state.requests ) {
        // Only garbage collect requests that are both stale and have been
        // cleaned.  This prevents us from collecting a request that's still in
        // use because it's component hasn't unmounted yet.
        if ( state.requests[requestId].cleaned && (isStale(state.requests[requestId], cacheTTL) || state.requests[requestId].cacheBusted)) {
            delete state.requests[requestId]
        }
        // If the cacheTTL is set to zero, that means we don't want to track
        // requests at all.  Every time we garbage collect, mark them as busted
        // so that they won't be reused.
        else if ( cacheTTL == 0 ) {
            state.requests[requestId].cacheBusted = true
        }
    }
}

export const bustRequestCache = function(state, action) {
    for ( const requestId in state.requests ) {
        state.requests[requestId].cacheBusted = true
    }
}

/******************************************************************************
 *
 * Request Helpers
 *
 * These are helper methods for making tracked and cached requests to API
 * endpoints, and for using cached requests.
 ******************************************************************************/

/**
 * Create a URLSearchParams object from an object of parameters.  Translates
 * things like arrays to the appropriate query string format.
 */
export const makeSearchParams = function(params) {
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

const getRequestFromCache = function(slice, method, endpoint) {
    return function(dispatch, getState) {
        const state = getState()
        for ( const id in state[slice.name].requests) {
            // It may not have been cleaned yet, because it's still in use, but
            // we still don't want to reuse it, because some other request
            // invalidated the data it contained.
            if ( state[slice.name].requests[id].cacheBusted) {
                continue
            }
            
            if ( state[slice.name].requests[id].method == method && state[slice.name].requests[id].endpoint == endpoint ) {
                const request = state[slice.name].requests[id]
                if ( request && request.state == 'fulfilled' ) {
                    dispatch(slice.actions.useRequest({ requestId: id }))
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
 * Make a request to an API endpoint.  Manages tracking the request, reusing
 * from the cache, and handling any errors.
 *  
 * Provides an `onSuccess` method, which will be called when the request
 * succeeds.  Errors are recorded on the request tracker object, which can be
 * retrieved from the provided Redux slice's `requests` dictionary using the
 * returned `requestId`.
 *
 * @param {function} dispatch   The Redux `dispatch()` method.
 * @param {function} getState   The Redux `getState()` method.
 * @param {Object}  slice       The Redux slice object from `createSlice()`.
 * @param {string} method       The HTTP verb to use as the request method (eg.
 * GET, POST, etc)
 * @param {string} endpoint     The endpoint we want to make a request to.
 * @param {function} onSuccess  A function to be called with the response's
 * body, parsed from JSON to a js object.
 *
 * @return {uuid}   A requestId that can be used to retrieve the request
 * tracker from the `slice`.  It will be stored in the `requests` object keyed
 * by the `requestId`, and can be found at `state.<slice-name>.requests[requestId]`
 */
export const makeTrackedRequest = function(dispatch, getState, slice, method, endpoint, body, onSuccess, onFailure) {
    const configuration = getState().system.configuration

    // Cleanup dead requests before making a new one.
    dispatch(slice.actions.garbageCollectRequests())

    if ( method == 'GET' ) {
        const request = dispatch(getRequestFromCache(slice, 'GET', endpoint))
        if ( request ) {
            onSuccess(request.result)
            return request.requestId
        }
    }


    const requestId = uuidv4()
    let status = 0
    let responseOk = false

    const fetchOptions = {
        method: method,
        headers: {
            'Accept': 'application/json'
        }
    }
    if ((method == 'POST' || method == 'PUT' || method == 'PATCH') && body ) {
        if ( body instanceof FormData ) {
            fetchOptions.body = body
        } else {
            fetchOptions.body = JSON.stringify(body)
            fetchOptions.headers['Content-Type'] = 'application/json'
        }
    }

    let fullEndpoint = ''
    // System slice requests need to go to the root, rather than the API
    // backend.  These requests include querying for the configuration that
    // contains the API backend itself, as well as for feature flags.
    if ( slice.name == 'system') {
        fullEndpoint = endpoint
    } else if (configuration == null ) {
        // If we're querying from anything other than the system slice before
        // we've got our configuration, then we have an error.
        throw new Error('Attempting to query from the API before the configuration is set!')
    } else {
        fullEndpoint = configuration.backend + endpoint
    }

    dispatch(slice.actions.makeRequest({requestId: requestId, method: method, endpoint: endpoint}))
    fetch(fullEndpoint, fetchOptions).then(function(response) {
        status = response.status
        responseOk = response.ok
        return response.json()
    }).then(function(responseBody) {
        // If the request doesn't exist, then bail out before completing
        // `onSuccess`.  This means it has already been cleaned up, and its
        // results are probably invalid.
        //
        // In any case, there's nothing to complete and nothing to fail.
        const state = getState()
        if( ! state[slice.name].requests[requestId] ) {
            return
        }

        if ( responseOk ) {
            if ( onSuccess ) {
                try {
                    onSuccess(responseBody)
                } catch (error) {
                    return Promise.reject(error)
                }
            }
            dispatch(slice.actions.completeRequest({ requestId: requestId, status: status, result: responseBody }))
        } else {
            dispatch(slice.actions.failRequest({ requestId: requestId, status: status, error: responseBody.error, errorData: responseBody.data }))
            if ( onFailure ) {
                try {
                    onFailure(responseBody)
                } catch (error) {
                    return Promise.reject(error)
                }
            }
        }
    }).catch(function(error) {
        logger.error(error)
        dispatch(slice.actions.failRequest({ requestId: requestId, status: status, error: 'frontend-request-error' }))
    })

    return requestId
}
