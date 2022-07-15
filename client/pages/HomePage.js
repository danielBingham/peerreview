import React from 'react'
import { useSelector } from 'react-redux'

import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'
import WelcomeNotice from '/components/about/notices/WelcomeNotice'
import SupportNotice from '/components/about/notices/SupportNotice'

import './HomePage.css'

const HomePage = function(props) {

    const fieldSettings = useSelector(function(state) {
        if ( state.authentication.settings ) {
            return state.authentication.settings.fields
        } else {
            return []
        }
    })

    let query = null
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
        query = {
            fields: isolated,
            excludeFields: ignored
        }
    }

    return (
        <div id="home-page" className="page">
            <WelcomeNotice />
            <SupportNotice />
            <PublishedPaperList query={query} />
        </div>
    )
}

export default HomePage
