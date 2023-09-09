import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { Document } from 'react-pdf/dist/esm/entry.webpack'

import Spinner from '/components/Spinner'

import PaperVersionTimelineEventsWrapper from './PaperVersionTimelineEventsWrapper'

const PaperVersionTimeline = function({ paperId, versionNumber }) {
    
    // ================= Redux State ==========================================
    
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    // ====== User Action Handling  ================================

    const loading = useCallback(function() {
        return (<Spinner local={true} />) 
    }, [])

    const onSourceError = useCallback((error) => console.log(error), [])

    const onLoadError = useCallback((error) => console.log(error), [])

    // ======= Effect Handling ======================================


    // ====== Render ===============================================

    // Generate the url for the file.
    let version = paper.versions.find((v) => v.version == versionNumber)
    if ( ! version ) {
        version = paper.versions[0]
    }
    const fileUrl = new URL(version.file.filepath, version.file.location)

    return (
        <>
            <Document 
                file={fileUrl.toString()} 
                loading={loading} 
                onSourceError={onSourceError}
                onLoadError={onLoadError}
            >
                <PaperVersionTimelineEventsWrapper paperId={paperId} versionNumber={versionNumber} /> 
            </Document>
        </>
    )

}

export default PaperVersionTimeline



