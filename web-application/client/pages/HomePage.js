import React, { useState, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'

import { DocumentCheckIcon, DocumentIcon } from '@heroicons/react/24/outline'

import PaperList from '/components/papers/list/PaperList'

import PaperSearchView from '/components/papers/search/PaperSearchView'
import WelcomeNotice from '/components/about/notices/WelcomeNotice'
import SupportNotice from '/components/about/notices/SupportNotice'
import WIPNotice from '/components/about/notices/WIPNotice'

import PageTabBar from '/components/generic/pagetabbar/PageTabBar'
import PageTab from '/components/generic/pagetabbar/PageTab'
import PageHeader from '/components/generic/PageHeader'

import Spinner from '/components/Spinner'

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


    const selectedTab = ( props.tab ? props.tab : 'papers')

    let content = ( <Spinner />)
    if ( selectedTab == 'papers' ) {
        content = (
            <>
                <PaperSearchView />
                <PaperList type="published" query={query} />
            </>
        )
    } else if ( selectedTab == 'preprints' ) {
        content = ( <PaperList type="preprint" /> )
    }

    return (
        <>
            <PageTabBar>
                <PageTab url="/papers" selected={selectedTab == 'papers'}>
                    <DocumentCheckIcon/>Papers 
                </PageTab>
                <PageTab url="/preprints" selected={selectedTab == 'preprints'}>
                    <DocumentIcon/>Preprints 
                </PageTab>
            </PageTabBar>
            <div id="home-page" className="page">
                { content }
            </div>
        </>
    )
}

export default HomePage
