import React, { useState, useEffect } from 'react'

import Field from '/components/fields/Field'

const PublishedPaperFieldsWidget = function(props) {

    const fields = []
    for(const field of props.paper.fields) {
        fields.push(<Field key={field.id} id={field.id} />) 
    }

    return (
        <div className="paper-fields">{fields}</div>
    )
}

export default PublishedPaperFieldsWidget
