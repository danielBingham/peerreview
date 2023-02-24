import React  from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import FieldView from '/components/fields/FieldView'
import FieldListView from '/components/fields/list/FieldListView'
import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'

import Spinner from '/components/Spinner'

import './FieldPage.css'

const FieldPage = function(props) {
    const { id } = useParams()

    const navigate = useNavigate()
    
    const selectTab = function(tabName) {
        if ( tabName == 'papers' ) {
            const url = `/field/${id}/papers`
            navigate(url)
        } else if ( tabName == 'parents' ) {
            const url = `/field/${id}/parents`
            navigate(url)
        } else if ( tabName == 'children' ) {
            const url = `/field/${id}/children`
            navigate(url)
        }
    }
    
    // ======= Render =====================================
    const selectedTab = ( props.tab ? props.tab : 'papers')

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'papers' ) {
        content = (
            <PublishedPaperList fieldId={ id } />
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
            <div className="page-tab-bar">
                <div onClick={(e) => selectTab('papers')} className={`page-tab ${ ( selectedTab == 'papers' ? 'selected' : '' )}`}>Papers</div>
                <div onClick={(e) => selectTab('parents')} className={`page-tab ${ ( selectedTab == 'parents' ? 'selected' : '')}`}>Parents</div>
                <div onClick={(e) => selectTab('children')} className={`page-tab ${ ( selectedTab == 'children' ? 'selected' : '' ) }`}>Children</div>
            </div>
            <div id="field-page" className="page">
                <FieldView id={ id } />
                { content }
            </div>
        </>
    )
}

export default FieldPage
