import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import { getPaper, cleanupRequest as cleanupPaperRequest } from '../../state/papers'
import { getReviews, patchReview, cleanupRequest as cleanupReviewRequest } from '../../state/reviews'

import ReviewCommentForm from './ReviewCommentForm'
import SubmissionPage from './SubmissionPage'
import Spinner from '../Spinner'

const ViewSubmission = function(props) {
    const [ paperRequestId, setPaperRequestId ] = useState(null)
    const [ reviewsRequestId, setReviewsRequestId ] = useState(null)
    const [ patchReviewRequestId, setPatchReviewRequestId ] = useState(null)

    const [ pages, setPages ] = useState([])

    const { paperId } = useParams() 

    const dispatch = useDispatch()

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

    const patchReviewRequest = useSelector(function(state) {
        if ( ! patchReviewRequestId ) {
            return null
        } else {
            return state.reviews.requests[patchReviewRequestId]
        }
    })

    const paper = useSelector(function(state) {
        if ( ! state.papers.dictionary[paperId] ) {
            return null
        } else {
            return state.papers.dictionary[paperId]
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const reviewInProgress = useSelector(function(state) {
        return state.reviews.list.filter((review) => review.paperId == paperId && review.userId == currentUser.id && review.status == 'in-progress')
    })

    const finishReview = function(event) {
        event.preventDefault()

        reviewInProgress.status = 'approved'
        setPatchReviewRequestId(dispatch(patchReview(reviewInProgress)))
    }

    useEffect(function() {
        if ( ( ! paper || paper.versions.length == 0 ) && ! paperRequest ) {
            setPaperRequestId(dispatch(getPaper(paperId)))
        } 

        return function cleanup() {
            if ( paperRequest ) {
                dispatch(cleanupPaperRequest(paperRequestId))
            }
        }

    }, [paperId])

    useEffect(function() {
        if ( paper && ! reviewsRequestId ) {
            setReviewsRequestId(dispatch(getReviews(paper.id)))
        }

        return function cleanup() {
            if ( reviewsRequest) {
                dispatch(cleanupReviewRequest(reviewsRequestId))
            }
        }

    }, [ paper, reviewsRequestId ])

    useEffect(function() {
        if ( paper && paper.versions.length > 0 && reviewsRequest && reviewsRequest.state == "fulfilled") {
            const loadingTask = PDFLib.getDocument('http://' + window.location.host + paper.versions[0].filepath)
            loadingTask.promise.then(function(pdf) {
                const newPages = []
                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                    const pageKey = `page-${pageNumber}`
                    newPages.push(<SubmissionPage key={pageKey} pageNumber={pageNumber} pdf={pdf} />)
                }
                setPages(newPages)
            }).catch(function(error) {
                console.error(error)
            })
        }

    }, [ paper, reviewsRequest ])

    if ( ! paper ) {
        return ( <Spinner /> )
    } else {
        let authorString = ''
        for(const author of paper.authors) {
            authorString += author.user.name + ( author.order < paper.authors.length ? ',' : '')
        }

        return (
            <section id={paper.id} className="paper-submission">
                <h2 className="paper-submission-title">{paper.title}</h2>
                <div className="paper-submission-authors">{authorString}</div>
                { reviewInProgress ?  <button onClick={finishReview}>Finish Review</button> : <button>Start a Review</button> }
                { pages }
            </section>
        )
    }

}

export default ViewSubmission
