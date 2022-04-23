
export default {

    getRequestTracker: function(method, endpoint) {
        return {
            requestMethod: method,
            requestEndpoint: endpoint,
            requestInProgress: false,
            error: null,
            status: null,
            completed: false

        }
    },


    makeRequest: function(requestTracker, action) {
        requestTracker.requestInProgress = true
        requestTracker.error = null
        requestTracker.completed = false
    },

    failRequest: function(requestTracker, action) {
        requestTracker.requestInProgress = false
        requestTracker.status = action.payload.status

        if ( action.payload.error ) {
            requestTracker.error = action.payload.error
        } else {
            requestTracker.error = 'Unknown error.'
        }

        requestTracker.completed = true
    },

    completeRequest: function(requestTracker, action) {
        requestTracker.requestInProgress = false
        requestTracker.error = null
        requestTracker.status = action.payload.status
        requestTracker.completed = true
    }

}


