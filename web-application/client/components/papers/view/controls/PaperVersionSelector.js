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

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    // ================= User Action Handling  ================================

    const changeVersion = function(event) {
        const versionNumber = event.target.value
        searchParams.set('version', versionNumber)
        setSearchParams(searchParams)
    }


    // ======= Effect Handling ======================================


    // ======= Render ===============================================

    const versionNumber = ( searchParams.get('version') ? searchParams.get('version') : paper.versions[0].version)

    const paperVersionOptions = []
    for( const paperVersion of paper.versions ) {
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
