import React, { useState, useEffect, useRef }  from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Timeline } from '/components/generic/timeline/Timeline'

import Spinner from '/components/Spinner'
import Error404 from '/components/Error404'

import PaperVersionTimeline from './PaperVersionTimeline'

import PaperCreationEvent from '/components/papers/view/timeline/events/PaperCreationEvent'

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
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    // ================= User Action Handling  ================================
    

    // ======= Effect Handling ======================================

    // ================= Render ===============================================
    
    // Error checking.
    if ( ! paper ) {
        return ( <Error404 /> ) 
    } 

    const sortedVersions = [ ...paper.versions ]
    sortedVersions.sort((a,b) => new Date(a.createdDate) - new Date(b.createdDate))

    const versionViews = []
    for(const version of sortedVersions) {
        versionViews.push(
            <PaperVersionTimeline key={version.version} paperId={paper.id} versionNumber={version.version} />
        )
    }

    return (
        <div id={`paper-${paperId}-timeline`} className="paper-timeline">
            <Timeline>
                <PaperCreationEvent paperId={paper.id} /> 
                { versionViews }
            </Timeline>
        </div>
    )

}

export default PaperTimeline 
