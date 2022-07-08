import React from 'react'
import { useParams } from 'react-router-dom'

import FieldView from '/components/fields/FieldView'
import FieldListView from '/components/fields/list/FieldListView'
import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'

import './FieldPage.css'

const FieldPage = function(props) {
    const { id } = useParams()

    return (
        <div id="field-page" className="page">
            <FieldView id={id} />
            <FieldListView id={id} />
            <PublishedPaperList query={ { fields: [ id ] } } />
        </div>
    )
}

export default FieldPage
