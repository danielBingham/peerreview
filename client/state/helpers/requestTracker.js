
const defaultCacheTTL = 60 * 1000 // 1 minute 
const isStale = function(tracker, overrideCacheTTL) {
    const cacheTTL = overrideCacheTTL ? overrideCacheTTL : defaultCacheTTL
    return (Date.now() - tracker.timestamp) > cacheTTL
}

export const getRequestTracker = function(requestId, method, endpoint) {
        return {
            requestId: requestId,
            method: method,
            endpoint: endpoint,
            timestamp: Date.now(),
            cleaned: false,
            state: 'none',
            error: null,
            status: null,
            result: null
        }
}

export const makeRequest = function(state, action) {
    const requestId = action.payload.requestId
    const method = action.payload.method
    const endpoint = action.payload.endpoint

    const tracker = getRequestTracker(requestId, method, endpoint)
    tracker.state = 'pending'
    state.requests[requestId] = tracker 
}

export const failRequest = function(state, action) {
    const tracker = state.requests[action.payload.requestId]
    
    tracker.state = 'failed'
    tracker.status = action.payload.status

    if ( action.payload.error ) {
        tracker.error = action.payload.error
    } else {
        tracker.error = 'unknown'
    }
}

export const completeRequest = function(state, action) {
    const tracker = state.requests[action.payload.requestId]

    tracker.state = 'fulfilled'
    tracker.status = action.payload.status
    tracker.result = action.payload.result
}

export const useRequest = function(state, action) {
    const tracker = state.requests[action.payload.requestId]
    tracker.cleaned = false
}

export const cleanupRequest = function(state, action) {
    const tracker = state.requests[action.payload.requestId]
    const cacheTTL = action.payload.cacheTTL

    if ( ! tracker ) {
        console.error('Warning: attempt to cleanup request that does not exit: ' + action.payload.requestId)
        return
    }

    if ( isStale(tracker, cacheTTL) ) {
        console.log(`cleanupRequest(${tracker.method}, ${tracker.endpoint}) - Deleting request: ${action.payload.requestId}.`)
        delete state.requests[action.payload.requestId]
    } else {
        console.log(`cleanupRequest(${tracker.method}, ${tracker.endpoint}) - Marking request cleaned: ${action.payload.requestId}.`)
        tracker.cleaned = true
    }
}

export const garbageCollectRequests = function(state, action) {
    const cacheTTL = action.payload
    for ( const requestId in state.requests ) {
        // Only garbage collect requests that are both stale and have been
        // cleaned.  This prevents us from collecting a request that's still in
        // use because it's component hasn't unmounted yet.
        if ( state.requests[requestId].cleaned && isStale(state.requests[requestId], cacheTTL)) {
            console.log(`garbatecollectRequests() - Deleting request: ${requestId} (${state.requests[requestId].method}, ${state.requests[requestId].endpoint}).`)
            delete state.requests[requestId]
        }
    }
}
