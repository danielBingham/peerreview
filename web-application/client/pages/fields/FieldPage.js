import React  from 'react'
import { useParams } from 'react-router-dom'

import FieldView from '/components/fields/FieldView'
import FieldListView from '/components/fields/list/FieldListView'
import PaperList from '/components/papers/list/PaperList'

import { DocumentCheckIcon, TagIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

import PageHeader from '/components/generic/PageHeader'
import PageTabBar from '/components/generic/pagetabbar/PageTabBar'
import PageTab from '/components/generic/pagetabbar/PageTab'
import Spinner from '/components/Spinner'

import './FieldPage.css'

const FieldPage = function(props) {
    const { id } = useParams()
    
    // ======= Render =====================================
    const selectedTab = ( props.tab ? props.tab : 'papers')

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
        <>
            <PageHeader>
                <FieldView id={ id } />
            </PageHeader>
            <PageTabBar>
                <PageTab url={`/field/${id}/papers`} selected={selectedTab == 'papers'}>
                    <DocumentCheckIcon /> Papers
                </PageTab>
                <PageTab url={`/field/${id}/parents`} selected={selectedTab == 'parents'}>
                    <TagIcon /> Parents
                </PageTab>
                <PageTab url={`/field/${id}/children`} selected={selectedTab == 'children'}>
                    <TagIcon /> Children
                </PageTab>
            </PageTabBar>
            <div id="field-page" className="page">
                { content }
            </div>
        </>
    )
}

export default FieldPage
