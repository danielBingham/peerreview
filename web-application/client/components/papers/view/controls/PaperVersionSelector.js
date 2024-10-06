import React from 'react'
import {  useSelector } from 'react-redux'
import {  useSearchParams } from 'react-router-dom'

import { CheckIcon } from '@heroicons/react/24/solid'

import { Select, SelectBody, SelectTrigger, SelectItem } from '/components/generic/select/Select'
import DateTag from '/components/DateTag'

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
        paperVersionId =  mostRecentVisibleVersion
    }
    console.log(`Most recent version: ${paperVersionId}.`)

    // ================= User Action Handling  ================================

    const changeVersion = function(id) {
        searchParams.set('version', id)
        // If we're changing the version, clear the review since reviews are
        // tied to version.
        searchParams.delete('review')
        setSearchParams(searchParams)
    }


    // ======= Effect Handling ======================================


    // ======= Render ===============================================

    const paperVersionOptions = []
    for( const paperVersion of Object.values(paperVersions) ) {
        paperVersionOptions.push(
            <SelectItem key={paperVersion.id} onClick={(e) => changeVersion(paperVersion.id)}>
                <div className="version">
                    <div className="id">{ paperVersionId == paperVersion.id && <CheckIcon />} { paperVersion.id }</div>
                    <DateTag type="full" timestamp={paperVersion.createdDate} />
                    { /*<div className="status">
                        <div className={paperVersion.isPreprint ? "yes" : "no"}>preprint</div>
                        <div className={paperVersion.isSubmitted ? "yes" : "no"}>submitted</div>
                        <div className={paperVersion.isPublished ? "yes" : "no"}>published</div>
                    </div> */ }
                </div>
            </SelectItem>)     
    }


    return (
        <div className="paper-version-selector">
            <Select>
                <SelectTrigger>
                    Version: { paperVersionId.substring(0,16) + "..." } 
                </SelectTrigger>
                <SelectBody>
                {paperVersionOptions}
                </SelectBody>
            </Select>
        </div>
    )

}

export default PaperVersionSelector
