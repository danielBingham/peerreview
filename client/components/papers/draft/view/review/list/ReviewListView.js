import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useSelector } from 'react-redux'

import Spinner from '/components/Spinner'

import ReviewCommentThreadView from '../comments/ReviewCommentThreadView'
import ReviewListItemView from './ReviewListItemView'
import './ReviewListView.css'

/**
 * Display a list of reviews for this paper, with the selected review on top.
 *
 * ASSUMPTIONS:
 * - We have a current user logged in.  Leaves it to the Page object to handle that.
 * - We've already refreshed the reviews in state.
 * 
 * @param {object} props    The standard react props object.
 * @param {object} props.paper - The populated paper object who's reviews we're
 * displaying.
 * @param {integer} props.versionNumber The number of the version we're currently viewing.
 */
const ReviewListView = function(props) {

    const [ searchParams, setSearchParams ] = useSearchParams()

    const [ height, setHeight ] = useState(0)
    const [ heightOffset, setHeightOffset ] = useState(0)


    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const reviews = useSelector(function(state) {
        if ( state.reviews.list[props.paper.id] && state.reviews.list[props.paper.id][props.versionNumber] ) {
            return state.reviews.list[props.paper.id][props.versionNumber]
        } else {
            return null 
        }
    })

    const reviewInProgress = useSelector(function(state) {
        if ( ! state.reviews.inProgress[props.paper.id] ) {
            return null
        } else if ( ! state.reviews.inProgress[props.paper.id][props.versionNumber] ) {
            return null
        }
        return state.reviews.inProgress[props.paper.id][props.versionNumber]
    })

    const threads = useSelector(function(state) {
        if ( searchParams.get('review') == 'all' ) {
            const results = []
            if ( state.reviews.list[props.paper.id] && state.reviews.list[props.paper.id][props.versionNumber]) {
                for ( const review of state.reviews.list[props.paper.id][props.versionNumber]) {
                    results.push(...review.threads)
                }
                results.sort((a,b) => {
                    if ( a.page != b.page ) {
                        return a.page - b.page
                    } else {
                        return a.pinY - b.pinY
                    }
                })
                return results
            }
        }
        return null
    })

    // ======= Actions and Event Handling ===========================

    const showAll = function(event) {
        searchParams.set('review', 'all')
        setSearchParams(searchParams)
    }

    const showReviews = function(event) {
        searchParams.delete('review')
        setSearchParams(searchParams)
    }


    // ======= Render ===============================================

    const reviewItems = []
    if ( reviews && ! threads ) {
        if ( reviewInProgress ) {
            reviewItems.push(
                <ReviewListItemView 
                    key={reviewInProgress.id} 
                    paper={props.paper} 
                    versionNumber={props.versionNumber}
                    review={reviewInProgress} 
                />
            )
        }
        for(const review of reviews) {
            if (reviewInProgress && review.id == reviewInProgress.id ) {
                continue
            }
            reviewItems.push(
                <ReviewListItemView 
                    key={review.id} 
                    paper={props.paper} 
                    versionNumber={props.versionNumber}
                    review={review} 
                />
            )
        }
    }

    let threadWrapper = ( null )
    if ( threads ) {
        const threadViews = [] 
        for (const thread of threads) {
            threadViews.push(
                <ReviewCommentThreadView 
                    key={thread.id} 
                    paper={props.paper} 
                    reviewId={thread.reviewId}
                    id={thread.id}
                />
            )
        }
        threadWrapper = (<div className="threads-wrapper">{threadViews}</div>)
    }

    const reviewsSelected = searchParams.get('review') != 'all' ? 'selected' : ''
    const allSelected = searchParams.get('review') == 'all' ? 'selected' : ''
    return (
        <>
            <div className="review-list-header">
                <div className={`reviews button ${reviewsSelected}`} onClick={showReviews}>Reviews</div>
                <div className={`show-all button ${allSelected}`} onClick={showAll}>All Comments</div>
            </div>
            <div className="review-list">
                <div className="items-wrapper">
                    { reviewItems }
                    { threadWrapper }
                </div>
            </div>
        </>
    )

}

export default ReviewListView 
