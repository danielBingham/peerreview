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

    // ======= Refs ==========================

    const ref = useRef(null)
    const initialOffset = useRef(null)
    const scrollPaneRef = useRef(null)

    // ======= Actions and Event Handling ===========================

    const showAll = function(event) {
        searchParams.set('review', 'all')
        setSearchParams(searchParams)
    }

    const showReviews = function(event) {
        searchParams.delete('review')
        setSearchParams(searchParams)
    }

    const scrollToPosition = function(y) {
        if ( scrollPaneRef.current ) {
            scrollPaneRef.current.scrollTo({
                top: y-(window.innerHeight/2),
                behavior: 'smooth'
            })
        }
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        const onScroll = function(event) {
            if ( ref.current ) {
                const rect = ref.current.getBoundingClientRect()
                if ( ! initialOffset.current ) {
                    initialOffset.current = rect.top 
                }

                if ( initialOffset.current ) {
                    const newHeightOffset = (initialOffset.current - window.scrollY > 10 ? initialOffset.current - window.scrollY : 10)
                    setHeightOffset(newHeightOffset)
                    setHeight(window.innerHeight - newHeightOffset- 20)
                } else if (initialOffset.current && window.scrollY < initialOffset.current) {
                    const newHeightOffset = initialOffset.current
                    setHeightOffset(newHeightOffset)
                    setHeight(window.innerHeight - newHeightOffset- 20)
                }
            }
        }

        document.addEventListener('scroll', onScroll)
        window.addEventListener('resize', onScroll)

        return function cleanup() {
            document.removeEventListener('scroll', onScroll)
            window.addEventListener('resize', onScroll)
        }

    })


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
                    scrollToPosition={scrollToPosition}
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
                    scrollToPosition={scrollToPosition}
                />
            )
        }
    }
    let style = { }
    if ( heightOffset != 0 && height != 0) {
        style.top = heightOffset +'px' 
        style.height = height + 'px'
    }

    let wrapperStyle = {}
    if ( heightOffset != 0 && height != 0) {
        wrapperStyle.height = (height-36) + 'px'
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
                    scrollToPosition={scrollToPosition}
                />
            )
        }
        threadWrapper = (<div className="threads-wrapper">{threadViews}</div>)
    }

    const reviewsSelected = threads ? '' : 'selected'
    const allSelected = threads ? 'selected' : ''
    return (
        <div ref={ref} className="review-list" style={style}>
            <div className="header">
                <div className={`reviews button ${reviewsSelected}`} onClick={showReviews}>Reviews</div>
                <div className={`show-all button ${allSelected}`} onClick={showAll}>All Comments</div>
            </div>
            <div ref={scrollPaneRef} className="items-wrapper" style={wrapperStyle}>
                { reviewItems }
                { threadWrapper }
            </div>
        </div>
    )

}

export default ReviewListView 
