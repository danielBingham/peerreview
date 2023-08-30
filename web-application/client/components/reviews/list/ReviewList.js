import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

import { newReview, getReviews, clearList, cleanupRequest } from '/state/reviews'

import { Document } from 'react-pdf/dist/esm/entry.webpack'

import { InboxArrowDownIcon, QuestionMarkCircleIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'


import { TabbedBox, TabbedBoxTab, TabbedBoxContent } from '/components/generic/tabbed-box/TabbedBox'
import { Timeline, TimelineItem, TimelineIcon, TimelineItemWrapper } from '/components/reviews/timeline/Timeline'

import UserProfileImage from '/components/users/UserProfileImage'
import UserTag from '/components/users/UserTag'
import JournalTag from '/components/journals/JournalTag'

import Spinner from '/components/Spinner'
import Error404 from '/components/Error404'

import ReviewView from '/components/reviews/view/ReviewView'
import ReviewDecisionControls from '/components/reviews/widgets/ReviewDecisionControls'
import SubmissionControls from '/components/journals/widgets/SubmissionControls'

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

    const [ getPaperSubmissionsRequestId, setGetPaperSubmissionRequestId ] = useState(null)

    // ================= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const submissions = useSelector(function(state) {
        const allSubmissions = Object.values(state.journalSubmissions.dictionary)
        return allSubmissions.filter((s) => s.paperId == paper.id)
    })

    const journalDictionary = useSelector(function(state) {
        const dictionary = {}
        for(const submission of submissions) {
            dictionary[submission.journalId] = state.journals.dictionary[submission.journalId]
        }
        return dictionary
    })

    const submittingAuthor = paper.authors.find((a) => a.submitter == true) 
    
    const editorSubmissions = submissions?.filter((s) => ( currentUser.memberships.find((m) => (m.permissions == 'owner' || m.permissions == 'editor') && s.journalId == m.journalId) ? true : false )) 

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

    const loading= useCallback(function() {
        return (<Spinner />) 
    }, [])

    const onSourceError = useCallback((error) => console.log(error), [])

    const onLoadError =useCallback((error) => console.log(error), [])

    const onLoadSuccess = useCallback(() => {
        // Scroll to the hash once the document has loaded.
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView()
        }
    }, [ document ])

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

    // Generate the url for the file.
    let version = paper.versions.find((v) => v.version == versionNumber)
    if ( ! version ) {
        version = paper.versions[0]
    }
    const fileUrl = new URL(version.file.filepath, version.file.location)

    console.log(editorSubmissions)
    let decisionViews = []
    let controlViews = []
    if ( paper.isDraft ) {
        if ( editorSubmissions ) {
            for(const submission of editorSubmissions ) {
                if ( ! submission.deciderId ) {
                    const membership = currentUser.memberships.find((m) => m.journalId == submission.journalId)
                    const membershipAction = ( membership.permissions == 'editor' || membership.permissions == 'owner') ? 'Editting' : 'Reviewing' 

                    controlViews.push(
                        <TabbedBox key={submission.id} className="submission-controls-wrapper">
                            <TabbedBoxTab>{ membershipAction } for <Link to={`/journal/${submission.journalId}`}>{ journalDictionary[submission.journalId].name }</Link></TabbedBoxTab>
                            <TabbedBoxContent>
                                <SubmissionControls submissionId={submission.id} />
                                <ReviewDecisionControls submission={submission} />
                            </TabbedBoxContent>
                        </TabbedBox>
                    )
                } else {
                    decisionViews.push(
                        <TimelineItem key={submission.id}>
                            <TimelineIcon>
                                <CheckBadgeIcon />
                            </TimelineIcon>
                            <TimelineItemWrapper>
                                <div className="decision">
                                    <div><UserTag id={submission.deciderId} /> { submission.status == 'published' ? 'published' : 'rejected' } this paper for <JournalTag paper={paper} submission={submission} />.</div>
                                    { submission.decisionComment }
                                </div>
                            </TimelineItemWrapper>
                        </TimelineItem>
                    )
                }

            }
        }
    } else {
        if ( submissions ) {
            for(const submission of submissions) {
                if ( submission.status == 'published' ) {
                    decisionViews.push(
                        <TimelineItem key={submission.id}>
                            <TimelineIcon>
                                <CheckBadgeIcon />
                            </TimelineIcon>
                            <TimelineItemWrapper>
                                <div className="decision">
                                    <div><UserTag id={submission.deciderId} /> published this paper in <JournalTag paper={paper} submission={submission} />.</div>
                                    { submission.decisionComment }
                                </div>
                            </TimelineItemWrapper>
                        </TimelineItem>
                    )
                }
            }
        }
    }

    return (
        <div id={`paper-${paperId}-review-list`} className="review-list">
            <Timeline>
                { submittingAuthor && <TimelineItem>
                    <TimelineIcon>
                        <InboxArrowDownIcon />
                    </TimelineIcon>
                    <TimelineItemWrapper>
                        <UserTag id={submittingAuthor.userId} /> submitted { paper.showPreprint ? 'preprint' : 'private draft' }. 
                    </TimelineItemWrapper>
                </TimelineItem> }
                <Document 
                    file={fileUrl.toString()} 
                    loading={loading} 
                    onSourceError={onSourceError}
                    onLoadError={onLoadError}
                    onLoadSuccess={onLoadSuccess}
                >
                    { reviewViews }
                </Document>
                { decisionViews }
            </Timeline>
            <div className="journal-controls">
                { controlViews }
            </div>
        </div>
    )

}

export default ReviewList 
