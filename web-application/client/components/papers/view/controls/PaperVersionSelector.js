import React from 'react'
import {  useSelector } from 'react-redux'
import {  useSearchParams } from 'react-router-dom'

import './PaperVersionSelector.css'

/**
 * Renders the control panel for the review screen.
 *
 * Assumptions:
 *  - paper already exists in the store
 *
 * @param {Object} props    Standard react props object.
 * @param {Object} props.id The id of the draft paper we're rendering controls for.
 */
const PaperVersionSelector = function({ paperId }) {

    const [ searchParams, setSearchParams ] = useSearchParams()

    // ================= Request Tracking =====================================

   
    // ================= Redux State ==========================================

    const paperVersions = useSelector(function(state) {
        return state.paperVersions.versionsByPaper[paperId]
    })

    const mostRecentVisibleVersion = useSelector(function(state) {
        if ( ! paperId in state.paperVersions.mostRecentVersion ) {
            throw new Error(`Paper(${paperId}) is missing most recent version!`)
        }

        return state.paperVersions.mostRecentVersion[paperId]
    })
  
    let paperVersionId = 0
    if ( searchParams.get('version') ) {
        paperVersionId = searchParams.get('version')
    } else {
        paperVersionId =  mostRecentVisibleVersion.version
    }

    // ================= User Action Handling  ================================

    const changeVersion = function(event) {
        const paperVersionId = event.target.value
        searchParams.set('version', paperVersionId)
        // If we're changing the version, clear the review since reviews are
        // tied to version.
        searchParams.delete('review')
        setSearchParams(searchParams)
    }


    // ======= Effect Handling ======================================


    // ======= Render ===============================================

    const paperVersionOptions = []
    for( const paperVersion of Object.values(paperVersions) ) {
        paperVersionOptions.push(<option key={paperVersion.id} value={paperVersion.id}>{ paperVersion.id}</option>)     
    }


    return (
        <div className="paper-version-selector">
            <label htmlFor="paperVersionId">Version</label>
            <select name="paperVersionId" value={paperVersionId} onChange={changeVersion}>
                {paperVersionOptions}
            </select>
        </div>
    )

}

export default PaperVersionSelector
