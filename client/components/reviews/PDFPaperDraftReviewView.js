import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import * as PDFLib from 'pdfjs-dist/webpack'

import { getPaper, patchPaper, cleanupRequest as cleanupPaperRequest } from '../../state/papers'
import { getReviews, patchReview, cleanupRequest as cleanupReviewRequest } from '../../state/reviews'

import ReviewCommentForm from './ReviewCommentForm'
import SubmissionPage from './SubmissionPage'
import Spinner from '../Spinner'

const PDFPaperDraftReviewView = function(props) {
    const [ paperRequestId, setPaperRequestId ] = useState(null)
    const [ reviewsRequestId, setReviewsRequestId ] = useState(null)
    const [ patchReviewRequestId, setPatchReviewRequestId ] = useState(null)
    const [ patchPaperRequestId, setPatchPaperRequestId ] = useState(null)

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

    const patchReviewRequest = useSelector(function(state) {
        if ( ! patchReviewRequestId ) {
            return null
        } else {
            return state.reviews.requests[patchReviewRequestId]
        }
    })

    const patchPaperRequest = useSelector(function(state) {
        if ( ! patchPaperRequestId ) {
            return null
        } else {
            return state.papers.requests[patchPaperRequestId]
        }
    })

    // ================= Redux State ==========================================

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
        const reviews = state.reviews.list.filter((review) => review.paperId == paperId && review.userId == currentUser.id && review.status == 'in-progress')
        if ( reviews.length > 0 ) {
            return reviews[0]
        } else {
            return null
        }
    })
    
    // ================= User Action Handling  ================================

    const finishReview = function(event) {
        event.preventDefault()

        const reviewPatch = {
            id: reviewInProgress.id,
            paperId: paper.id,
            status: 'approved'
        }
        setPatchReviewRequestId(dispatch(patchReview(reviewPatch)))
    }

    const publishPaper = function(event) {
        event.preventDefault()
        console.log('Publish Paper.')

        const paperPatch = {
            id: paper.id,
            isDraft: false
        }
        setPatchPaperRequestId(dispatch(patchPaper(paperPatch)))
    }

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
                dispatch(cleanupPaperRequest(paperRequestId))
            }
        }

    }, [paperId])

    /**
     * Once we've retrieved the papers, retrieve the reviews.
     */
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

        if ( patchPaperRequestId && patchPaperRequest && patchPaperRequest.state == 'fulfilled' ) {
            const paperPath = '/paper/' + paper.id
            navigate(paperPath)
        }

        return function cleanup() {
            if ( patchPaperRequest ) {
                dispatch(cleanupPaperRequest(patchPaperRequestId))
            }
        }

    })

    /**
     * Once we have the paper and the reviews, load the PDFs so we can display
     * them.
     */
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

    // ================= Render ===============================================
    
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
                <button onClick={publishPaper}>Publish</button>
                { pages }
            </section>
        )
    }

}

export default PDFPaperDraftReviewView
