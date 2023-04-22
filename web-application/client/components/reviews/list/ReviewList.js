import React, { useState, useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { newReview, getReviews, clearList, cleanupRequest } from '/state/reviews'

import { Document } from 'react-pdf/dist/esm/entry.webpack'


import Spinner from '/components/Spinner'
import Error404 from '/components/Error404'

import ReviewView from '/components/reviews/view/ReviewView'

import './ReviewList.css'

/**
 * Show a draft paper and its reviews, or show the reviews from the draft stage
 * of a published paper.
 *
 * Assumptions:
 *  - Assumes we have a current user logged in.  
 * 
 * @param {Object} props    Standard react props object.
 * @param {int} props.paperId    The paperId of the draft paper we want to load and show
 * reviews for. 
 */
const ReviewList = function({ paperId, versionNumber }) {
    
    // ================= Request Tracking =====================================
    
    const [ requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
           return state.papers.requests[requestId]
        }
    })

    const [ postReviewsRequestId, setPostReviewRequestId ] = useState(null)
    const postReviewsRequest = useSelector(function(state) {
        if ( ! postReviewsRequestId ) {
            return null
        } else {
            return state.reviews.requests[postReviewsRequestId]
        }
    })

    // ================= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const reviews = useSelector(function(state) {
        if ( state.reviews.list[paperId] ) {
            if ( state.reviews.list[paperId][versionNumber] ) {
                return state.reviews.list[paperId][versionNumber]
            }
        }

        return [] 
    })

    const reviewInProgress = useSelector(function(state) {
        if ( state.reviews.inProgress[paperId] ) {
            return state.reviews.inProgress[paperId][versionNumber]
        } else {
            return null
        }
    })

    // ================= User Action Handling  ================================
    
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const startReview = function(event) {
        if ( ! reviewInProgress ) {
            setPostReviewRequestId(dispatch(newReview(paperId, versionNumber, currentUser.id)))
        }
    }

    // ======= Effect Handling ======================================
    
    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        dispatch(clearList(paperId))
        setRequestId(dispatch(getReviews(paperId)))
    }, [])

    useEffect(function() {
        if ( postReviewsRequest && postReviewsRequest.state == 'fulfilled' ) {
            navigate(`/draft/${paperId}/version/${versionNumber}/drafts`)
        }
    }, [ postReviewsRequest ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // Request tracker cleanup.
    useEffect(function() {
        return function cleanup() {
            if ( postReviewsRequestId ) {
                dispatch(cleanupRequest({ requestId: postReviewsRequestId }))
            }
        }
    }, [ postReviewsRequestId ])


    // ================= Render ===============================================
    
    // Error checking.
    if ( ! paper ) {
        return ( <Error404 /> ) 
    } 

    if ( ! requestId || (request && request.state == 'pending') ) {
        return (<div id={`paper-${paperId}-review-list`} className="review-list"><Spinner /></div>)
    }

    if ( request && request.state == 'failed' ) {
        return ( <div id={`paper-${paperId}-review-list`} className="review-list">
            <div className="error">
                Something went wrong with the attempt to retrieve the paper. <br />
                Error Type: {request.error}
            </div>
        </div>
        )
    }

    const reviewViews = []
    for(let review of reviews) {
        if ( review.status == 'in-progress' ) {
            continue
        }

        reviewViews.push(
            <ReviewView key={review.id} id={review.id} paperId={paperId} versionNumber={versionNumber} />
        )          
    }

    if ( reviewInProgress ) {
        reviewViews.push(
            <ReviewView key={reviewInProgress.id} id={reviewInProgress.id} paperId={paperId} versionNumber={versionNumber} />
        )
    }


    let version = paper.versions.find((v) => v.version == versionNumber)
    if ( ! version ) {
        version = paper.versions[0]
    }

    const url = new URL(version.file.filepath, version.file.location)

    let draftsTabUrl = ''
    if ( paper.isDraft ) {
        draftsTabUrl = `/draft/${paperId}/version/${versionNumber}/drafts`
    } else {
        draftsTabUrl = `/paper/${paperId}/version/${versionNumber}/drafts`
    }
    return (
        <div id={`paper-${paperId}-review-list`} className="review-list">
            <div className="header">
                { reviewViews.length > 0 && <span>Viewing { reviews.length } reviews on version { versionNumber}.  To read the full text, go to the <a href={draftsTabUrl}> drafts tab</a>.</span> }
                { paper.isDraft && reviewViews.length <= 0 && ! reviewInProgress && <div className="empty-list">
                        No reviews have been written yet for version {versionNumber}.  Read the full text on the <a href={draftsTabUrl}>drafts tab</a> and <button onClick={startReview} >Start Review</button> to be the first to write one!
                    </div> }
                { paper.isDraft && reviewViews.length <= 0 && reviewInProgress && <span>
                    No reviews have been written yet for version {versionNumber}.  Read the full text and complete your review in progress on the <a href={draftsTabUrl}>drafts tab</a>!</span> }
                { reviewInProgress && <div>You have a review in progress.</div> }
                { ! paper.isDraft && reviewViews.length <= 0 && <span>No reviews were written for this paper.</span> }
            </div>
            <Document 
                file={url.toString()} 
                loading={<Spinner />} 
                onSourceError={(error) => console.log(error)}
                onLoadError={(error) => console.log(error)}
                onLoadSuccess={() => {
                    // Scroll to the hash once the document has loaded.
                    if ( document.location.hash ) {
                        document.querySelector(document.location.hash).scrollIntoView()
                    }
                }}
            >
                { reviewViews }
            </Document>
        </div>
    )

}

export default ReviewList 
