
export default {

    getRequestTracker: function(method, endpoint) {
        return {
            requestMethod: method,
            requestEndpoint: endpoint,
            state: 'none',
            error: null,
            status: null,

        }
    },


    makeRequest: function(requestTracker, action) {
        requestTracker.state = 'pending' 
        requestTracker.error = null
    },

    failRequest: function(requestTracker, action) {
        requestTracker.state = 'failed' 
        requestTracker.status = action.payload.status

        if ( action.payload.error ) {
            requestTracker.error = action.payload.error
        } else {
            requestTracker.error = 'Unknown error.'
        }
    },

    completeRequest: function(requestTracker, action) {
        requestTracker.state = 'fulfilled' 

        requestTracker.error = null
        requestTracker.status = action.payload.status
    }

}


