import React, { useState, useEffect, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { setSelected } from '/state/reviews'

import { CheckCircleIcon, AnnotationIcon, XCircleIcon } from '@heroicons/react/outline'
import  { CheckIcon, XIcon } from '@heroicons/react/solid'

import ReviewCommentThreadView from '../comments/ReviewCommentThreadView'

import UserTag from '/components/users/UserTag'
import DateTag from '/components/DateTag'
import Spinner from '/components/Spinner'

import './ReviewListItemView.css'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 */
const ReviewListItemView = function(props) {

    const [searchParams, setSearchParams] = useSearchParams()

    const isOpen = searchParams.get('review') == props.review.id
    const threads = useSelector(function(state) {
        if ( ! isOpen ) {
            return []
        } else {
            const results = [...state.reviews.dictionary[props.review.paperId][props.review.id].threads]
            return results.sort((a,b) => {
                if ( a.page != b.page ) {
                    return a.page - b.page
                } else {
                    return a.pinY - b.pinY
                }
            })
        }
    })

    // ======= Actions and Event Handling ===========================
    
    const dispatch = useDispatch()
    const onClick = function(event) {
        if ( searchParams.get('review') != props.review.id) {
            searchParams.set('review', props.review.id)
            setSearchParams(searchParams)
        } else {
            searchParams.delete('review')
            setSearchParams(searchParams)
        }
    }


    // ======= Render ===============================================


    let recommendation = null
    if ( props.review.status !== 'in-progress' ) {
        let message = null
        if ( props.review.recommendation == 'commentary' ) {
            message = (<div className="commentary">Commentary (No recommendation)</div>)
        } else if ( props.review.recommendation == 'approve' ) {
            message = (<div className="approved"><CheckCircleIcon /> Recommends Approval</div>)
        } else if ( props.review.recommendation == 'request-changes' ) {
            message = (<div className="request-changes"><AnnotationIcon /> Recommends Changes</div>)
        } else if ( props.review.recommendation == 'reject' ) {
            message = (<div className="rejected"><XCircleIcon /> Recommends Rejection</div>)
        }

        recommendation = (
            <div className="recommendation">
                {message}
            </div>
        )
    }

    let status = null
    if ( props.review.status !== 'submitted' ) {

        let message = null
        if ( props.review.status == 'in-progress' ) {
            message = (<div className="in-progress">Review In Progress</div>)
        } else if ( props.review.status == 'accepted' ) {
            message = (<div className="accepted"><CheckIcon /> Accepted</div>)
        } else if ( props.review.status == 'rejected') {
            message = (<div className="rejected"><XIcon /> Rejected</div>)
        }

        status = (
            <div className="status">
                {message}
            </div>
        )
    }

    const threadViews = []
    if ( isOpen && threads.length > 0) {
        for (const thread of threads) {
            threadViews.push(
                <ReviewCommentThreadView 
                    key={thread.id} 
                    paper={props.paper} 
                    reviewId={props.review.id}
                    id={thread.id}
                    scrollToPosition={props.scrollToPosition}
                />
            )
        }
    }

    const classes = 'review-list-item' + (isOpen ? ' selected' : '')
    return (
        <>
            <div className={classes} onClick={onClick} >
                <UserTag id={props.review.userId} />
                <div className="created">Review #{props.review.id} started <DateTag timestamp={props.review.createdDate} /></div>
                { recommendation }
                { status }
            </div>
            <div className="threads-wrapper">
                {threadViews}
            </div>
        </>
    )

}

export default ReviewListItemView 
