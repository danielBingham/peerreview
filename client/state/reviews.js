import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration'
import logger from '../logger'

import { addUsers } from './users'
import RequestTracker from './helpers/requestTracker'

export const reviewsSlice = createSlice({
    name: 'reviews',
    initialState: {
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of reviews we've retrieved from the backend, keyed by
         * review.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         * A list of the reviews we've retrieved.  Contains the same objects as
         * the dictionary, this just allows for quick and easy searching of the
         * objects we've loaded using `filter` and other array processing
         * methods.
         *
         * @type {Object[]}
         */
        list: []
    },
    reducers: {
        // ========== GET /reviews ==================

        /**
         * The GET request to /reviews succeeded.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.reviews - An array of populated review objects
         */
        completeGetReviewsRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            if ( action.payload.result && action.payload.result.length > 0) {
                for ( const review of action.payload.result ) {
                    state.dictionary[review.id] = review
                    state.list = state.list.filter((r) => r.id !== review.id)
                    state.list.push(review)
                }
            }
        },

        // ========== DELETE /review/:id =================

        /**
         * Finish the DELETE /review/:id call.  In this case, the call returns
         * the id of the deleted review and we need to delete them from state on
         * our side.  
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.reviewId - The id of the deleted review
         */
        completeDeleteReviewRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)
            delete state.dictionary[action.payload.result] 
            state.list = state.list.filter((review) => review.id !== action.payload.result)
        },

        // ========== Generic Request Methods =============
        // Use these methods when no extra logic is needed.  If additional
        // logic is needed for a particular request, make a reducer of the form
        // [make/fail/complete/cleanup][method][endpoint]Request().  For
        // example, makePostReviewsRequest().  The reducer should take an object
        // with at least requestId defined, along with whatever all inputs it
        // needs.

        /**
         * Make a request to a review or reviews endpoint.
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
         * Fail a request to a review or reviews endpoint, usually with an error.
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
         * Complete a request to a review or reviews endpoint by setting the review
         * sent back by the backend in the reviews hash.
         *
         * @param {object} state - The redux state slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - The payload sent with the action.
         * @param {string} action.payload.requestId - A uuid for the request.
         * @param {object} action.payload.review - A populated review object, must have `id` defined
         */
        completeRequest: function(state, action) {
            RequestTracker.completeRequest(state.requests[action.payload.requestId], action)

            state.dictionary[action.payload.result.id] = action.payload.result
            state.list = state.list.filter((review) => review.id != action.payload.result.id)
            state.list.push(action.payload.result)
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
 * GET /reviews
 *
 * Get all reviews in the database.  Populates state.reviews.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getReviews = function(paperId) {
    return function(dispatch, getState) {
        const requestId = uuidv4() 
        const endpoint = `/paper/${paperId}/reviews`

        let payload = {
            requestId: requestId
        }

        dispatch(reviewsSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
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
        }).then(function(reviews) {
            payload.result = reviews
            dispatch(reviewsSlice.actions.completeGetReviewsRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(reviewsSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * POST /reviews
 *
 * Create a new review.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} review - A populated review object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postReviews = function(review) {
    return function(dispatch, getState) {
        console.log('Review recieved.')
        console.log(review)

        const requestId = uuidv4()
        const endpoint = `/paper/${review.paperId}/reviews`

        const payload = {
            requestId: requestId
        }

        dispatch(reviewsSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedReview) {
            payload.result = returnedReview
            dispatch(reviewsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(reviewsSlice.actions.failRequest(payload))
        })

        return requestId
    }
}



/**
 * GET /review/:id
 *
 * Get a single review.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the review we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getReview = function(paperId, id) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = `/paper/${paperId}/review/${id}`

        const payload = {
            requestId: requestId
        }

        dispatch(reviewsSlice.actions.makeRequest({requestId: requestId, method: 'GET', endpoint: endpoint}))
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
        }).then(function(review) {
            payload.result = review
            dispatch(reviewsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(reviewsSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * PUT /review/:id
 *
 * Replace a review wholesale. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} review - A populated review object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const putReview = function(review) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = `/paper/${review.paperId}/review/${review.id}`

        const payload = {
            requestId: requestId
        }

        dispatch(reviewsSlice.actions.makeRequest({requestId: requestId, method: 'PUT', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()

            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }

        }).then(function(returnedReview) {
            payload.result = returnedReview
            dispatch(reviewsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(reviewsSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * PATCH /review/:id
 *
 * Update a review from a partial `review` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} review - A populate review object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchReview = function(review) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = `/paper/${review.paperId}/review/${review.id}`

        const payload = {
            requestId: requestId
        }

        dispatch(reviewsSlice.actions.makeRequest({requestId: requestId, method: 'PATCH', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedReview) {
            payload.result = returnedReview
            dispatch(reviewsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(reviewsSlice.actions.failRequest(payload))
        })

        return requestId
    }
}

/**
 * DELETE /review/:id
 *
 * Delete a review. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} review - A populated review object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteReview = function(review) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = `/paper/${review.paperId}/review/${review.id}`

        const payload = {
            requestId: requestId,
            result: review.id
        }
        
        dispatch(reviewsSlice.actions.makeRequest({requestId: requestId, method: 'DELETE', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function(response) {
            payload.status = response.status
            if( response.ok ) {
                dispatch(reviewsSlice.actions.completeDeleteReviewRequest(payload))
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
            dispatch(reviewsSlice.actions.failRequest(payload))
        })

        return requestId
    }
} 

/**
 * POST /paper/:paper_id/review/:review_id/comments
 *
 * Add a comment to a review.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} review - A populated review object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postReviewComments = function(paperId, reviewId, comment) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = `/paper/${paperId}/review/${reviewId}/comments`

        const payload = {
            requestId: requestId
        }

        dispatch(reviewsSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(comment)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedReview) {
            payload.result = returnedReview
            dispatch(reviewsSlice.actions.completeRequest(payload))
        }).catch(function(error) {
            if (error instanceof Error) {
                payload.error = error.toString()
            } else {
                payload.error = 'Unknown error.'
            }
            logger.error(error)
            dispatch(reviewsSlice.actions.failRequest(payload))
        })

        return requestId
    }
}


export const { completeGetReviewsRequest, completeDeleteReviewRequest, makeRequest, failRequest, completeRequest, cleanupRequest }  = reviewsSlice.actions

export default reviewsSlice.reducer
