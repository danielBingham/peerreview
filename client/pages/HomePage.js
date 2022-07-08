import React from 'react'
import { useSelector } from 'react-redux'

import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'
import WelcomeNotice from '/components/about/notices/WelcomeNotice'
import SupportNotice from '/components/about/notices/SupportNotice'

import './HomePage.css'

const HomePage = function(props) {

    const settings = useSelector(function(state) {
        return state.authentication.settings
    })

    let query = null
    if ( settings && settings.fields) {
        const ignored = []
        const isolated = []
        for (const settingField of settings.fields) {
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
