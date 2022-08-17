import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import PublishedPaperView from '/components/papers/published/view/PublishedPaperView'
import DraftPaperView from '/components/papers/draft/view/DraftPaperView'

const PublishedPaperPage = function(props) {

    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Routing Parameters ===================================
    
    const { id } = useParams() 
    const versionNumber = searchParams.get('version')

    const selectTab = function(tabName) {
        searchParams.set('tab', tabName)
        setSearchParams(searchParams)
    }


    const selectedTab = ( searchParams.get('tab') ? searchParams.get('tab') : 'paper')
    return (
        <>
            <div className="page-tab-bar">
                <div onClick={(e) => selectTab('paper')} className={`page-tab ${ ( selectedTab == 'paper' ? 'selected' : '' )}`}>Paper</div>
                <div onClick={(e) => selectTab('reviews')} className={`page-tab ${ ( selectedTab == 'reviews' ? 'selected' : '')}`}>Reviews</div>
            </div>
            <div id="published-paper-page" className="page">
                { selectedTab == 'paper' && <PublishedPaperView  id={id} /> }
                { selectedTab == 'reviews' && <DraftPaperView id={id} versionNumber={versionNumber}/> }
            </div>
        </>
    )
}

export default PublishedPaperPage
