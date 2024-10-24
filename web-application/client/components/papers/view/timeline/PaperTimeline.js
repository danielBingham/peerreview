import React, { useState, useEffect, useRef }  from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Timeline } from '/components/generic/timeline/Timeline'

import Spinner from '/components/Spinner'
import Error404 from '/components/Error404'

import PaperVersionTimeline from './PaperVersionTimeline'

import PaperCreationEvent from '/components/papers/view/timeline/events/PaperCreationEvent'
import PaperTimelineCommentForm from '/components/papers/view/timeline/comment-form/PaperTimelineCommentForm'

import './PaperTimeline.css'

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
const PaperTimeline = function({ paperId }) {

    // ================= Request Tracking =====================================

    // ================= Redux State ==========================================

    const paperVersions = useSelector(function(state) {
        return state.paperVersions.versionsByPaper[paperId]
    })

    // ================= User Action Handling  ================================
    

    // ======= Effect Handling ======================================

    // ================= Render ===============================================
    
    // Error checking.
    if ( ! paperVersions ) {
        return ( <Error404 /> ) 
    } 

    const sortedVersions = Object.values(paperVersions)
    sortedVersions.sort((a,b) => new Date(a.createdDate) - new Date(b.createdDate))

    const versionViews = []
    for(const version of sortedVersions) {
        versionViews.push(
            <PaperVersionTimeline key={version.id} paperId={paperId} paperVersionId={version.id} />
        )
    }

    return (
        <div id={`paper-${paperId}-timeline`} className="paper-timeline">
            <Timeline>
                <PaperCreationEvent paperId={paperId} /> 
                { versionViews }
                <PaperTimelineCommentForm paperId={paperId} />
            </Timeline>
        </div>
    )

}

export default PaperTimeline 
