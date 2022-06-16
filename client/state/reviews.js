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
         * A hash of reviews current in progress, keyed by paperId - one review
         * for each paper.
         *
         * @type {object}
         */
        inProgress: {},

        /**
         * A hash of reviews current selected, keyed by paperId, one review for
         * each paper.
         *
         * @type {object}
         */
        selected: {},

        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A two dimensional dictionary of reviews, the first layer is keyed by
         * paper.id, the second by review.id
         *
         * @type {object}
         */
        dictionary: {},

        /**
         * A dictionary, keyed by paper.id, of lists of reviews we've retrieved
         * for each paper.  The lists preserve order.
         *
         * @type {Object[]}
         */
        list: {} 
    },
    reducers: {
        setInProgress: function(state, action) {
            const review = action.payload

            state.inProgress[review.paperId] = review
        },

        setSelected: function(state, action) {
            const review = action.payload

            state.selected[review.paperId] = review
        },

        clearSelected: function(state, action) {
            const paperId = action.payload
            state.selected[paperId] = null
        },

        /**
         * @param {object} state - The redux slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - Either a single review object or a
         * list of review objects.
         */
        addReviewsToDictionary: function(state, action) {
            if (action.payload.length ) {
                for(const review of action.payload ) {
                    if ( ! state.dictionary[review.paperId] ) {
                        state.dictionary[review.paperId] = {}
                    }
                    state.dictionary[review.paperId][review.id] = review
                }
            } else {
                const review = action.payload
                if ( ! state.dictionary[review.paperId] ) {
                    state.dictionary[review.paperId] = {}
                }
                state.dictionary[review.paperId][review.id] = review 
            }
        },

        appendReviewsToList: function(state, action) {
            if ( action.payload.length ) {
                for ( const review of action.payload ) {
                    if ( ! state.dictionary[review.paperId] ) {
                        state.dictionary[review.paperId] = {}
                    }
                    if ( ! state.list[review.paperId] ) {
                        state.list[review.paperId] = []
                    }
                    state.dictionary[review.paperId][review.id] = review
                    if ( ! state.list[review.paperId].find((r) => r.id == review.id) ) {
                        state.list[review.paperId].push(review)
                    }
                }
            } else {
                const review = action.payload
                if ( ! state.dictionary[review.paperId] ) {
                    state.dictionary[review.paperId] = {}
                }
                if ( ! state.list[review.paperId] ) {
                    state.list[review.paperId] = []
                }
                state.dictionary[review.paperId][review.id] = review
                if ( ! state.list[review.paperId].find((r) => r.id == review.id)) {
                    state.list[review.paperId].push(review)
                }
            }
        },

        removeReview: function(state, action) {
            const review = action.payload
            if ( state.list[review.paperId] ) {
                state.list[review.paperId] = state.list[review.paperId].filter((r) => r.id !== review.id)
            }
            if ( state.dictionary[review.paperId] ) {
                delete state.dictionary[review.paperId][review.id]
            }
        },

        clearList: function(state, action) {
            const review = action.payload
            state.list[review.paperId] = [] 
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
            if ( reviews ) {
                dispatch(reviewsSlice.actions.addReviewsToDictionary(reviews))
                dispatch(reviewsSlice.actions.appendReviewsToList(reviews))

                const state = getState()
                if ( state.authentication.currentUser ) {
                    for ( const review of reviews ) {
                        if ( review.status == 'in-progress' && review.userId == state.authentication.currentUser.id) {
                            dispatch(reviewsSlice.actions.setInProgress(review))
                        }
                    }
                }
            }

            payload.result = reviews
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
            dispatch(reviewsSlice.actions.addReviewsToDictionary(returnedReview))
            dispatch(reviewsSlice.actions.appendReviewsToList(returnedReview))

            const state = getState()
            if ( state.authentication.currentUser && returnedReview.userId == state.authentication.currentUser.id && returnedReview.status == 'in-progress') {
                dispatch(reviewsSlice.actions.setInProgress(returnedReview))
            }

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
            if ( review ) {
                dispatch(reviewsSlice.actions.addReviewsToDictionary(review))
                dispatch(reviewsSlice.actions.appendReviewsToList(review))

                const state = getState()
                if ( state.authentication.currentUser && review.userId == state.authentication.currentUser.id && review.status == 'in-progress') {
                    dispatch(reviewsSlice.actions.setInProgress(review))
                }
            }

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
            dispatch(reviewsSlice.actions.addReviewsToDictionary(returnedReview))
            dispatch(reviewsSlice.actions.appendReviewsToList(returnedReview))

            const state = getState()
            if ( state.authentication.currentUser && returnedReview.userId == state.authentication.currentUser.id && returnedReview.status == 'in-progress') {
                dispatch(reviewsSlice.actions.setInProgress(returnedReview))
            }

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
            dispatch(reviewsSlice.actions.addReviewsToDictionary(returnedReview))
            dispatch(reviewsSlice.actions.appendReviewsToList(returnedReview))

            const state = getState()
            if ( state.authentication.currentUser && returnedReview.userId == state.authentication.currentUser.id && returnedReview.status == 'in-progress') {
                dispatch(reviewsSlice.actions.setInProgress(returnedReview))
            }

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
            result: review
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
                dispatch(reviewsSlice.actions.removeReview(review))
                dispatch(reviewsSlice.actions.completeRequest(payload))
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


export const { setSelected, clearSelected, setInProgress, completeGetReviewsRequest, completeDeleteReviewRequest, makeRequest, failRequest, completeRequest, cleanupRequest }  = reviewsSlice.actions

export default reviewsSlice.reducer
