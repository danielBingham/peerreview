import React from 'react'
import { useParams } from 'react-router-dom'

import FieldListView from '/components/fields/list/FieldListView'
import PublishedPaperList from '/components/papers/published/list/PublishedPaperList'

const FieldPage = function(props) {
    const { id } = useParams()
    console.log('FieldPage: id')
    console.log(id)

    return (
        <section id="field-page">
            <FieldListView id={id} />
            <PublishedPaperList query={ { fields: [ id ] } } />
        </section>
    )
}

export default FieldPage
