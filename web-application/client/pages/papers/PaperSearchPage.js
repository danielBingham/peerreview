import React, { useState, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useSearchParams } from 'react-router-dom'

import { Page, PageBody } from '/components/generic/Page'

import PaperSearchView from '/components/papers/search/PaperSearchView'
import PaperList from '/components/papers/list/PaperList'

import './PaperSearchPage.css'

const PaperSearchPage = function(props) {

    return (
        <Page id="paper-search-page">
            <PageBody>
                <PaperSearchView  />
                <PaperList type="published" />
            </PageBody>
        </Page>
    )
}

export default PaperSearchPage
