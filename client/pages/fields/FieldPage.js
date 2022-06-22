import React from 'react'
import { useParams } from 'react-router-dom'


const FieldPage = function(props) {
    const { id } = useParams()

    return (
        <section id="field-page">
            <FieldListView id={id} />
        </section>
    )
}

export default FieldPage
