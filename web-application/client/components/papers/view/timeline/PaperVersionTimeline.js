import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { Document, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

import Spinner from '/components/Spinner'

import PaperVersionTimelineEventsWrapper from './PaperVersionTimelineEventsWrapper'

const PaperVersionTimeline = function({ paperId, versionNumber }) {
    
    // ================= Redux State ==========================================

    const file = useSelector(function(state) {
        if ( ! state.paperVersions.files[paperId] ) {
            return null
        }

        return state.paperVersions.files[paperId][versionNumber]
    })

    // ====== User Action Handling  ================================

    const loading = useCallback(function() {
        return (<Spinner local={true} />) 
    }, [])

    const onSourceError = useCallback((error) => console.log(error), [])

    const onLoadError = useCallback((error) => console.log(error), [])

    // ======= Effect Handling ======================================


    // ====== Render ===============================================

    if ( ! file ) {
        return (
            <Spinner local={true} />
        )
    }

    return (
        <>
            <Document 
                file={file} 
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



