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
        return state.paperVersions.dictionary[paperId]
    })

    const mostRecentVisibleVersion = useSelector(function(state) {
        if ( ! paperId in state.paperVersions.mostRecentVersion ) {
            throw new Error(`Paper(${paperId}) is missing most recent version!`)
        }

        return state.paperVersions.mostRecentVersion[paperId]
    })
  
    let versionNumber = 0
    if ( searchParams.get('version') ) {
        versionNumber = searchParams.get('version')
    } else {
        versionNumber =  mostRecentVisibleVersion.version
    }

    // ================= User Action Handling  ================================

    const changeVersion = function(event) {
        const versionNumber = event.target.value
        searchParams.set('version', versionNumber)
        // If we're changing the version, clear the review since reviews are
        // tied to version.
        searchParams.delete('review')
        setSearchParams(searchParams)
    }


    // ======= Effect Handling ======================================


    // ======= Render ===============================================

    const paperVersionOptions = []
    for( const paperVersion of Object.values(paperVersions) ) {
        paperVersionOptions.push(<option key={paperVersion.version} value={paperVersion.version}>{ paperVersion.version }</option>)     
    }


    return (
        <div className="paper-version-selector">
            <label htmlFor="versionNumber">Version</label>
            <select name="versionNumber" value={versionNumber} onChange={changeVersion}>
                {paperVersionOptions}
            </select>
        </div>
    )

}

export default PaperVersionSelector
