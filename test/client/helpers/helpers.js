
/**
 * Get a request tracker for testing purposes.
 */
export const getTracker = function(requestId, method, endpoint) {
    const expectedRequestTracker = {
        requestId: requestId,
        method: method,
        endpoint: endpoint,
        timestamp: 'NOW',
        cleaned: false,
        cacheBusted: false,
        state: 'pending',
        result: null,
        error: null,
        errorData: {},
        status: null,
        uses: 1
    }
    return expectedRequestTracker
}

/** 
 * Use a test function to check the state on every update to see if a
 * condition is met.  Resolve with the matched state once we've met the
 * condition.
 */
export const waitForState = function(store, testFunction) {
    // If testFunction is already `true`, don't wait for the next update.  Just
    // return the current state.
    let state = store.getState()
    if ( testFunction(state) ) {
        return new Promise(function(resolve, reject) {
            resolve(state)
        })
    }

    // Otherwise, wait for an update that matches testFunction()
    return new Promise(function(resolve, reject) {
        store.subscribe(function() {
            state = store.getState()
            if ( testFunction(state) ) {
                resolve(state)
            }
        })
    })
}
