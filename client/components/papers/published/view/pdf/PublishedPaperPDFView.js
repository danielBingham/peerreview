import React, {  useEffect } from 'react'

import Spinner from '/components/Spinner'
import PDFViewer from '/components/pdf/PDFViewer'

import './PublishedPaperPDFView.css'

const PublishedPaperPDFView = function(props) {

    // ================= Render ===============================================

    const url = new URL(props.paper.versions[0].file.filepath, props.paper.versions[0].file.location)
    let content = ( <Spinner /> ) 
    if ( props.paper.versions.length > 0 ) {
        content = ( <PDFViewer url={url.href} /> )
    }

    return (
        <section className="published-paper-pdf-view">
            { content }        
        </section>
    )

}

export default PublishedPaperPDFView 
