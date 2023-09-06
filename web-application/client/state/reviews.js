import { createSlice } from '@reduxjs/toolkit'

import logger from '../logger'

import setRelationsInState from './helpers/relations'

import {
    setInDictionary,
    removeEntity,
    makeQuery,
    setQueryResults,
    clearQuery,
    clearQueries
} from './helpers/state'

import { 
    makeTrackedRequest,
    makeSearchParams,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    bustRequestCache,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

export const reviewsSlice = createSlice({
    name: 'reviews',
    initialState: {
       
        // ======== Standard State ============================================
        
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of reviews we've retrieved from the backend keyed by
         * review.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * Structure:
         * {
         *  queryName: {
         *      meta: {
         *          page: <int>,
         *          count: <int>,
         *          pageSize: <int>,
         *          numberOfPages: <int>
         *      },
         *      list: [] 
         *  },
         *  ...
         * }
         */
        queries: {},

        // ======== Specific State ============================================
        
        /**
         * A hash of reviews current in progress, keyed by paperId and version - one review
         * for each paper version.
         *
         * @type {object}
         */
        inProgress: {}

    },
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setReviewsInDictionary: setInDictionary,
        removeReview: removeEntity,
        makeReviewQuery: makeQuery,
        setReviewQueryResults: setQueryResults,
        clearReviewQuery: clearQuery,
        clearReviewQueries: clearQueries,

        // ======== Review Specific State Manipulation =========================
        
        setInProgress: function(state, action) {
            const review = action.payload
            if ( ! state.inProgress[review.paperId] ) {
                state.inProgress[review.paperId] = {}
            }

            state.inProgress[review.paperId][review.version] = review
        },

        clearInProgress: function(state, action) {
            const paperId = action.payload.paperId
            const version = action.payload.version

            if ( state.inProgress[paperId] ) {
                state.inProgress[paperId][version] = null
            }
        },


        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess, 
        useRequest: useRequest,
        bustRequestCache: bustRequestCache,
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
        dispatch(reviewsSlice.actions.setReviewsInDictionary({ entity: review }))

        const state = getState()
        if ( state.authentication.currentUser 
            && review.userId == state.authentication.currentUser.id && review.status == 'in-progress') 
        {
            dispatch(reviewsSlice.actions.setInProgress(review))
        } else if ( state.reviews.inProgress[review.paperId] && state.reviews.inProgress[review.paperId][review.version] 
            && review.id == state.reviews.inProgress[review.paperId][review.version].id && review.status != 'in-progress') 
        {
            dispatch(reviewsSlice.actions.clearInProgress({ paperId: review.paperId, version: review.version })) 
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
export const getReviews = function(name, paperId) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, reviewsSlice,
            'GET', `/paper/${paperId}/reviews`, null,
            function(response) {
                dispatch(reviewsSlice.actions.setReviewsInDictionary({ dictionary: response.dictionary }))
                
                dispatch(reviewsSlice.actions.setReviewQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))

                const state = getState()
                if ( state.authentication.currentUser ) {
                    for ( const [ id, review ] of Object.entries(response.dictionary)) {
                        if ( review.status == 'in-progress' && review.userId == state.authentication.currentUser.id) {
                            dispatch(reviewsSlice.actions.setInProgress(review))
                        } 
                    }
                }
            }

        )
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

        dispatch(reviewsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, reviewsSlice,
            'POST', `/paper/${review.paperId}/reviews`, review,
            function(response) {
                dispatch(reviewsSlice.actions.setReviewsInDictionary({ entity: response.entity }))
                dispatch(reviewsSlice.actions.clearReviewQueries())

                dispatch(setRelationsInState(response.relations))

                if ( response.entity.status == 'in-progress' ) {
                    dispatch(reviewsSlice.actions.setInProgress(response.entity))
                }
            }
        )
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
        return makeTrackedRequest(dispatch, getState, reviewsSlice,
            'GET', `/paper/${paperId}/review/${id}`, null,
            function(response) {
                dispatch(reviewsSlice.actions.setReviewsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
                
                if ( response.entity.status == 'in-progress' ) {
                    dispatch(reviewsSlice.actions.setInProgress(response.entity))
                }
            }
        )
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
 *
 * NOTE: NOT IMPLEMENTED.
 */
    /*export const putReview = function(review) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, reviewsSlice,
            'PUT', `/paper/${review.paperId}/review/${review.id}`, review,
            function(returnedReview) {
                dispatch(updateReview(returnedReview))
            }
        )
    }
}*/

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
export const patchReview = function(paperId, review) {
    return function(dispatch, getState) {
        dispatch(reviewsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, reviewsSlice,
            'PATCH', `/paper/${paperId}/review/${review.id}`, review,
            function(response) {
                dispatch(reviewsSlice.actions.setReviewsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
              
                const state = getState()
                // TODO FIX ME - this misses updates that change the status from 'in-progress' to not in-progres
                if ( response.entity.status == 'in-progress' ) {
                    dispatch(reviewsSlice.actions.setInProgress(response.entity))
                }
                else if( state.reviews.inProgress[paperId] 
                    && state.reviews.inProgress[paperId][response.entity.version].id == response.entity.id
                    && response.entity.status != 'in-progress')  
                {
                    dispatch(reviewsSlice.actions.clearInProgress({ paperId: paperId, version: response.entity.version })) 
                }
            }
        )
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
export const deleteReview = function(id) {
    return function(dispatch, getState) {
        const state = getState()
        const review = state.reviews.dictionary[id]
        dispatch(reviewsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, reviewsSlice,
            'DELETE', `/paper/${review.paperId}/review/${review.id}`, null,
            function(response) {
                dispatch(reviewsSlice.actions.removeReview({ entity: review }))
                dispatch(reviewsSlice.actions.clearReviewQueries())
        
                if ( review.status == 'in-progress') {
                    dispatch(reviewsSlice.actions.clearInProgress({ paperId: review.paperId, version: review.version }))
                }
            }
        )
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
        dispatch(reviewsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, reviewsSlice,
            'POST', `/paper/${paperId}/review/${reviewId}/threads`, threads,
            function(response) {
                dispatch(reviewsSlice.actions.setReviewsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
                
                if ( response.entity.status == 'in-progress' ) {
                    dispatch(reviewsSlice.actions.setInProgress(response.entity))
                }
            }
        )
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
        dispatch(reviewsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, reviewsSlice,
            'POST', `/paper/${paperId}/review/${reviewId}/thread/${threadId}/comments`, comments,
            function(response) {
                dispatch(reviewsSlice.actions.setReviewsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
                
                if ( response.entity.status == 'in-progress' ) {
                    dispatch(reviewsSlice.actions.setInProgress(response.entity))
                }
            }
        )
    }
}

/**
 * Handle a race condition that can occur sometimes if the user goes straight
 * from editing a comment to cancelling their review.
 *
 * Clicking the cancel button fires the delete request, but bluring the comment
 * fires the patch request.  The order of these actions is not gauranteed, and
 * they can interleave in such a way that it causes a flicker and the review
 * to reappear after deletion.
 *
 * TECHDEBT There's gotta be a better way to do this.
 */
const checkForDeleteRequest = function(paperId, reviewId, state) {
    const deleteEndpoint = `/paper/${paperId}/review/${reviewId}`
    const searchableRequests = Object.entries(state.reviews.requests)
    const deleteRequest = searchableRequests.find((kv) => kv[1].method == "DELETE" && kv[1].endpoint == deleteEndpoint) 
    return deleteRequest ? true : false
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
        const endpoint = `/paper/${paperId}/review/${reviewId}/thread/${threadId}/comment/${comment.id}`
        dispatch(reviewsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, reviewsSlice,
            'PATCH', endpoint, comment,
            function(response) {
                // Handle a race condition - see method comment.
                if ( checkForDeleteRequest(paperId, reviewId, getState()) ) {
                    throw new Error('Review deleted mid patch.')
                }

                dispatch(reviewsSlice.actions.setReviewsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
                
                if ( response.entity.status == 'in-progress' ) {
                    dispatch(reviewsSlice.actions.setInProgress(response.entity))
                }
            }
        )
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
        const endpoint = `/paper/${paperId}/review/${reviewId}/thread/${threadId}/comment/${comment.id}`
        dispatch(reviewsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, reviewsSlice,
            'DELETE', endpoint, null,
            function(response) {
                dispatch(reviewsSlice.actions.setReviewsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
                
                if ( response.entity.status == 'in-progress' ) {
                    dispatch(reviewsSlice.actions.setInProgress(response.entity))
                }
            }
        )
    }
} 


export const {  
    setReviewsInDictionary,
    setInProgress, clearInProgress,
    cleanupRequest 
}  = reviewsSlice.actions

export default reviewsSlice.reducer
