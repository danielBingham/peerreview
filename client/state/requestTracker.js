
export default function getRequestTracker() {
    return {
        target: null,
        requestInProgress: false,
        error: null,
        completed: false

    }
}

export const makeRequest = function(requestTracker, action) {
    requestTracker.target = action.payload
    requestTracker.requestInProgress = true
    requestTracker.error = null
    requestTracker.completed = false
}

export const failRequest = function(requestTracker, action) {
    requestTracker.requestInProgress = false
    requestTracker.error = action.payload 
    requestTracker.completed = true
}

export const completeRequest = function(requestTracker, action) {
    requestTracker.requestInProgress = false
    requestTracker.error = null
    requestTracker.completed = true
}
