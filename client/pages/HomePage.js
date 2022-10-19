import React, { useState, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'

import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'
import PaperSearchView from '/components/papers/search/PaperSearchView'
import WelcomeNotice from '/components/about/notices/WelcomeNotice'
import SupportNotice from '/components/about/notices/SupportNotice'
import WIPNotice from '/components/about/notices/WIPNotice'

import './HomePage.css'

const HomePage = function(props) {
    const [ query, setQuery ] = useState({})

    const fieldSettings = useSelector(function(state) {
        if ( state.authentication.settings ) {
            return state.authentication.settings.fields
        } else {
            return []
        }
    })

    // Feature Flag: wip-notice
    const wipNoticeFeature = useSelector(function(state) {
        return state.features.dictionary['wip-notice']
    })

    useLayoutEffect(function() {
        if (fieldSettings && fieldSettings.length > 0) {
            let newQuery = { ...query } 

            const ignored = []
            const isolated = []

            for (const settingField of fieldSettings) {
                if( settingField.setting == 'isolated' ) {
                    isolated.push(settingField.fieldId)
                } else if (settingField.setting == 'ignored' ) {
                    ignored.push(settingField.fieldId)
                }
            }

            newQuery.fields = isolated
            newQuery.excludeFields = ignored

            setQuery(newQuery)
        }
    }, [ fieldSettings ])

    return (
        <div id="home-page" className="page">
            { wipNoticeFeature && wipNoticeFeature.status == 'enabled' && <WIPNotice /> }
            <WelcomeNotice />
            <SupportNotice />
            <PaperSearchView />
            <PublishedPaperList query={query} />
        </div>
    )
}

export default HomePage
