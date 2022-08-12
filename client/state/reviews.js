import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import configuration from '../configuration'
import logger from '../logger'

import { addUsers } from './users'
import { makeRequest as makeTrackedRequest, 
    failRequest as failTrackedRequest, 
    completeRequest as completeTrackedRequest, 
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

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
         * A dictionary, keyed by paper.id and paper.version, of lists of
         * reviews we've retrieved for each paper.  The lists preserve order.
         *
         * Structure:
         * ```
         * { 
         *  1: {
         *      1: []
         *      2: []
         *      3: []
         *      }
         *  2: {
         *      1: []
         *      2: []
         *     }
         * }
         * ```
         *
         * @type {Object[]}
         */
        list: {},

        /**
         * A hash of review counts, keyed by paper.id and paper.version.
         */
        counts: {}

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

        replaceReview: function(state, action) {
            const review = action.payload
            if ( ! state.dictionary[review.paperId] ) {
                state.dictionary[review.paperId] = {}
            }
            state.dictionary[review.paperId][review.id] = review

            if ( ! state.list[review.paperId] ) {
                state.list[review.paperId] = {} 
            }
            if ( ! state.list[review.paperId][review.version] ) {
                state.list[review.paperId][review.version] = []
            }

            const index = state.list[review.paperId][review.version].findIndex((r) => r.id == review.id)
            if ( index >= 0 ) {
                state.list[review.paperId][review.version][index] = review
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
                    state.list[review.paperId] = {} 
                }
                if ( ! state.list[review.paperId][review.version] ) {
                    state.list[review.paperId][review.version] = [] 
                }
                state.list[review.paperId][review.version].push(review)
            }
        },

        removeReview: function(state, action) {
            const review = action.payload
            if ( state.list[review.paperId] && state.list[review.paperId][review.version]) {
                state.list[review.paperId][review.version] = state.list[review.paperId][review.version].filter((r) => r.id != review.id)
            }
            if ( state.dictionary[review.paperId] ) {
                delete state.dictionary[review.paperId][review.id]
            }
        },

        clearList: function(state, action) {
            const paperId = action.payload
            state.list[paperId] = {}
        },

        setCounts: function(state, action) {
            state.counts = action.payload
        },

        // ========== Request Tracking Methods =============

        makeRequest: makeTrackedRequest, 
        failRequest: failTrackedRequest, 
        completeRequest: completeTrackedRequest,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})

/**
 * Start a new review.
*/
export const newReview = function(paperId, version, userId, threads) {
    return function(dispatch, getState) {
        const review = {
            paperId: paperId,
            userId: userId, 
            version: version,
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
    }
}

/**
 * GET /reviews/count
 *
 * Get counts of reviews by paper.id and paper.version 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const countReviews = function() {
    return function(dispatch, getState) {
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())

        const requestId = uuidv4() 
        const endpoint = `/reviews/count`

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
        }).then(function(counts) {
            dispatch(reviewsSlice.actions.setCounts(counts))

            payload.result = counts 
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
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())

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
            if ( reviews && reviews.length > 0) {
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
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())

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
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())

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
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())

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
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())
        
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
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())

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
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())
        
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
        }).then(function(returned) {
            dispatch(updateReview(returned.review))

            payload.result = returned 
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
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())

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
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())

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
        // Cleanup dead requests before making a new one.
        dispatch(reviewsSlice.actions.garbageCollectRequests())

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


export const {  
    setInProgress, clearInProgress,
    replaceReview, 
    appendReviewsToList, clearList, 
    addReviewsToDictionary, 
    makeRequest, failRequest, completeRequest, cleanupRequest 
}  = reviewsSlice.actions

export default reviewsSlice.reducer
