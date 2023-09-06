import React  from 'react'
import { useParams } from 'react-router-dom'

import FieldView from '/components/fields/FieldView'
import FieldListView from '/components/fields/list/FieldListView'
import PaperList from '/components/papers/list/PaperList'

import { DocumentCheckIcon, TagIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageTabBar, PageTab } from '/components/generic/Page'

import './FieldPage.css'

const FieldPage = function(props) {
    const { id, pageTab } = useParams()
    
    // ======= Render =====================================
    const selectedTab = ( pageTab ? pageTab : 'papers')

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'papers' ) {
        content = (
            <PaperList type="published" fieldId={ id } />
        )
    } else if ( selectedTab == 'parents' ) {
        content = (
            <FieldListView title={ 'Parents' } child={ id } />
        )
    } else if ( selectedTab == 'children' ) {
        content = (
            <FieldListView title={ 'Children' } parent={ id } />
        )
    }

    return (
        <Page id="field-page">
            <PageHeader>
                <FieldView id={ id } />
            </PageHeader>
            <PageTabBar>
                <PageTab url={`/field/${id}/papers`} tab="papers" initial={true}>
                    <DocumentCheckIcon /> Papers
                </PageTab>
                <PageTab url={`/field/${id}/parents`} tab="parents">
                    <TagIcon /> Parents
                </PageTab>
                <PageTab url={`/field/${id}/children`} tab="children">
                    <TagIcon /> Children
                </PageTab>
            </PageTabBar>
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )
}

export default FieldPage
