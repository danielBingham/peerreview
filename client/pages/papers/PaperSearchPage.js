import React, { useState, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useSearchParams } from 'react-router-dom'

import PaperSearchView from '/components/papers/search/PaperSearchView'
import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'

import './PaperSearchPage.css'

const PaperSearchPage = function(props) {
    const [ query, setQuery ] = useState({})
    const [ searchParams, setSearchParams ] = useSearchParams()

    const fieldSettings = useSelector(function(state) {
        if ( state.authentication.settings ) {
            return state.authentication.settings.fields
        } else {
            return []
        }
    })

    useLayoutEffect(function() {
        if ( searchParams && searchParams.get('q') ) {
            const newQuery = { ...query }
            newQuery.searchString = searchParams.get('q')
            setQuery(newQuery)
        }
    }, [searchParams])

    useLayoutEffect(function() {
        if (fieldSettings && fieldSettings.length > 0) {
            const ignored = []
            const isolated = []

            for (const settingField of fieldSettings) {
                if( settingField.setting == 'isolated' ) {
                    isolated.push(settingField.fieldId)
                } else if (settingField.setting == 'ignored' ) {
                    ignored.push(settingField.fieldId)
                }
            }

            const newQuery = { ...query }
            newQuery.fields = isolated
            newQuery.excludeFields = ignored
            setQuery(newQuery)
        }
    }, [])

    return (
        <div id="paper-search-page" className="page">
            <PaperSearchView  />
            <PublishedPaperList query={query} />
        </div>
    )
}

export default PaperSearchPage
