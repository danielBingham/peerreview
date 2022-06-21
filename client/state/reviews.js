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

        clearInProgress: function(state, action) {
            const paperId = action.payload

            state.inProgress[paperId] = null
        },

        setSelected: function(state, action) {
            const review = action.payload

            state.selected[review.paperId] = review
        },

        clearSelected: function(state, action) {
            const paperId = action.payload
            state.selected[paperId] = null
        },

        replaceReview: function(state, action) {
            const review = action.payload
            if ( ! state.dictionary[review.paperId] ) {
                state.dictionary[review.paperId] = {}
            }
            if ( ! state.list[review.paperId] ) {
                state.list[review.paperId] = [] 
            }
            state.dictionary[review.paperId][review.id] = review
            const index = state.list[review.paperId].findIndex((r) => r.id == review.id)
            if ( index >= 0 ) {
                state.list[review.paperId][index] = review
            }
        },

        /**
         * @param {object} state - The redux slice.
         * @param {object} action - The redux action we're reducing.
         * @param {object} action.payload - Either a single review object or a
         * list of review objects.
         */
        addReviewsToDictionary: function(state, action) {
            let reviews = ( action.payload.length ? action.payload : [ action.payload ] ) 

            for(const review of reviews) {
                if ( ! state.dictionary[review.paperId] ) {
                    state.dictionary[review.paperId] = {}
                }
                state.dictionary[review.paperId][review.id] = review
            }
        },

        appendReviewsToList: function(state, action) {
            let reviews = (action.payload.length ? action.payload : [ action.payload ])

            for ( const review of reviews) {
                if ( ! state.list[review.paperId]) {
                    state.list[review.paperId] = []
                }
                state.list[review.paperId].push(review)
            }
        },

        removeReview: function(state, action) {
            const review = action.payload
            if ( state.list[review.paperId] ) {
                state.list[review.paperId] = state.list[review.paperId].filter((r) => r.id != review.id)
            }
            if ( state.dictionary[review.paperId] ) {
                delete state.dictionary[review.paperId][review.id]
            }
        },

        clearList: function(state, action) {
            const paperId = action.payload
            state.list[paperId] = [] 
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
 * Start a new review.
*/
export const newReview = function(paperId, userId, threads) {
    return function(dispatch, getState) {
        const review = {
            paperId: paperId,
            userId: userId, 
            summary: '',
            status: 'in-progress',
            recommendation: 'request-changes',
            threads: []
        }
        if ( threads ) {
            review.threads = threads
        }
        return dispatch(postReviews(review))
    }
}

export const updateReview = function(review) {
    return function(dispatch, getState) {
        dispatch(reviewsSlice.actions.replaceReview(review))

        const state = getState()
        if ( state.authentication.currentUser && review.userId == state.authentication.currentUser.id && review.status == 'in-progress') {
            dispatch(reviewsSlice.actions.setInProgress(review))
        } else if ( state.reviews.inProgress[review.paperId] && review.id == state.reviews.inProgress[review.paperId].id && review.status != 'in-progress') {
            dispatch(reviewsSlice.actions.clearInProgress(review.paperId)) 
        }

        if ( state.reviews.selected[review.paperId] && state.reviews.selected[review.paperId].id == review.id) {
            dispatch(reviewsSlice.actions.setSelected(review))
        }

    }
}

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
                        } else if ( state.reviews.selected[review.paperId] && state.reviews.selected[review.paperId].id == review) {
                            dispatch(reviewsSlice.actions.setSelected(review))
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
            dispatch(updateReview(returnedReview))
            dispatch(reviewsSlice.actions.appendReviewsToList(returnedReview))

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
                dispatch(updateReview(review))

                const state = getState()
                if ( ! state.reviews.list[review.paperId] || ! state.reviews.list[review.paperId].find((r) => r.id == review.id)) {
                    dispatch(reviewsSlice.actions.appendReviewsToList(review))
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
            dispatch(updateReview(returnedReview))

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
            dispatch(updateReview(returnedReview))

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
 * POST /paper/:paper_id/review/:review_id/threads
 *
 * Add a comment thread to a review.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} paperId - The id of the paper this review is of.
 * @param {object} reviewId - The id of the review this thread belongs to.
 * @param {object} threads - A single thread or an array of threads to add to this review.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postReviewThreads = function(paperId, reviewId, threads) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = `/paper/${paperId}/review/${reviewId}/threads`

        const payload = {
            requestId: requestId
        }

        dispatch(reviewsSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(threads)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedReview) {
            dispatch(updateReview(returnedReview))

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
 * POST /paper/:paper_id/review/:review_id/thread/:thread_id/comments
 *
 * Add a comment to a comment thread on a review.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 * 
 * @param {int} paperId - The id of the paper the review is of.
 * @param {int} reviewId - The id of the review the comment is on.
 * @param {int} threadId - The id of the thread we're adding comments to.
 * @param {object} comemnts - A single comment or an array of comments to add to the thread identified by threadId. 
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postReviewComments = function(paperId, reviewId, threadId, comments) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = `/paper/${paperId}/review/${reviewId}/thread/${threadId}/comments`

        const payload = {
            requestId: requestId
        }

        dispatch(reviewsSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(comments)
        }).then(function(response) {
            payload.status = response.status
            if ( response.ok ) {
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedReview) {
            dispatch(updateReview(returnedReview))

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
 * PATCH /paper/:paper_id/review/:review_id/thread/:thread_id/comment/:comment_id
 *
 * Patch a comment.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 * 
 * @param {int} paperId - The id of the paper the review is of.
 * @param {int} reviewId - The id of the review the comment is on.
 * @param {int} threadId - The id of the thread we're adding comments to.
 * @param {object} comemnts - A single comment or an array of comments to add to the thread identified by threadId. 
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchReviewComment = function(paperId, reviewId, threadId, comment) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = `/paper/${paperId}/review/${reviewId}/thread/${threadId}/comment/${comment.id}`

        const payload = {
            requestId: requestId
        }

        dispatch(reviewsSlice.actions.makeRequest({requestId:requestId, method: 'POST', endpoint: endpoint}))
        fetch(configuration.backend + endpoint, {
            method: 'PATCH',
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
            dispatch(updateReview(returnedReview))

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
 * DELETE /paper/:paper_id/review/:review_id/thread/:thread_id/comment/:comment_id
 *
 * Delete a comment. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} comment - A populated comment object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteReviewComment = function(paperId, reviewId, threadId, comment) {
    return function(dispatch, getState) {
        const requestId = uuidv4()
        const endpoint = `/paper/${paperId}/review/${reviewId}/thread/${threadId}/comment/${comment.id}`

        const payload = {
            requestId: requestId,
            result: comment 
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
                return response.json()
            } else {
                return Promise.reject(new Error('Request failed with status: ' + response.status))
            }
        }).then(function(returnedReview) {
            dispatch(updateReview(returnedReview))

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


export const { setSelected, clearSelected, setInProgress, replaceReview, appendReviewsToList, clearList, addReviewsToDictionary, makeRequest, failRequest, completeRequest, cleanupRequest }  = reviewsSlice.actions

export default reviewsSlice.reducer
