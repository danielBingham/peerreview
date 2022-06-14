import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getPaper, cleanupRequest as cleanupPaperRequest } from '/state/papers'
import { getReviews, cleanupRequest as cleanupReviewRequest } from '/state/reviews'

import Field from '/components/fields/Field'
import Spinner from '/components/Spinner'

import ReviewListView from './review/ReviewListView'
import ReviewControlView from './review/widgets/ReviewControlView'

import DraftPaperPDFView from './pdf/DraftPaperPDFView'

/**
 * Assumes we have a current user logged in.  Leaves it to the Page object to handle that.
 *
 */
const DraftPaperView = function(props) {
    const [ paperRequestId, setPaperRequestId ] = useState(null)
    const [ reviewsRequestId, setReviewsRequestId ] = useState(null)

    const [ pages, setPages ] = useState([])

    const { paperId } = useParams() 

    const dispatch = useDispatch()
    const navigate = useNavigate()

    // ================= Request Tracking =====================================
    const paperRequest = useSelector(function(state) {
        if ( ! paperRequestId) {
            return null
        } else {
           return state.papers.requests[paperRequestId]
        }
    })

    const reviewsRequest = useSelector(function(state) {
        if ( ! reviewsRequestId ) {
            return null
        } else {
            return state.reviews.requests[reviewsRequestId]
        }
    })

    // ================= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        if ( ! state.papers.dictionary[paperId] ) {
            return null
        } else {
            return state.papers.dictionary[paperId]
        }
    })

    const reviews = useSelector(function(state) {
        if ( ! paper ) {
            return null
        } else {
            return state.reviews.list.filter((r) => r.paperId == paper.id)
        }
    })

    const reviewInProgress = ( reviews ? reviews.find((r) => r.userId == currentUser.id && r.status == 'in-progress') : null )

    /**
     * If we haven't retrieved the paper we're viewing yet, go ahead and
     * retrieve it from the paper endpoint to get full and up to date data.
     */
    useEffect(function() {
        if ( ! paperRequest ) {
            setPaperRequestId(dispatch(getPaper(paperId)))
        } 

        return function cleanup() {
            if ( paperRequest ) {
                dispatch(cleanupPaperRequest(paperRequest))
            }
        }

    }, [ paperId ])

    /**
     * Once we've retrieved the papers, retrieve the reviews.
     */
    useEffect(function() {
        if ( paper && ! reviewsRequestId ) {
            setReviewsRequestId(dispatch(getReviews(paper.id)))
        }

        return function cleanup() {
            if ( reviewsRequest) {
                dispatch(cleanupReviewRequest(reviewsRequest))
            }
        }

    }, [ paper, reviewsRequestId ])


    // ================= Render ===============================================
    
    if (paperRequest && paperRequest.state == 'fulfilled' && reviewsRequest && reviewsRequest.state == 'fulfilled') {
        let authorString = ''
        for(const author of paper.authors) {
            authorString += author.user.name + ( author.order < paper.authors.length ? ', ' : '')
        }

        let fields = []
        for(const field of paper.fields) {
            fields.push(<Field key={field.id} field={field} />)
        }

        return (
            <section id={paper.id} className="draft-paper">
                <h2 className="title">{paper.title}</h2>
                <div className="authors">{authorString}</div>
                <div className="fields">{fields}</div>
                <ReviewControlView paper={paper} reviewInProgress={reviewInProgress} />
                <ReviewListView reviews={reviews} />
                <DraftPaperPDFView paper={paper} />
            </section>
        )
     } else {
         return (
             <Spinner />
         )
     }

}

export default DraftPaperView 
