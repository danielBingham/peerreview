import React  from 'react'
import { useParams } from 'react-router-dom'

import FieldView from '/components/fields/FieldView'
import FieldListView from '/components/fields/list/FieldListView'
import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'

import './FieldPage.css'

const FieldPage = function(props) {
    const { id } = useParams()

    // ======= Render =====================================

    return (
        <div id="field-page" className="page">
            <FieldView id={ id } />
            <FieldListView title={ 'Parents' } child={ id } />
            <FieldListView title={ 'Children' } parent={ id } />
            <PublishedPaperList fieldId={ id } />
        </div>
    )
}

export default FieldPage