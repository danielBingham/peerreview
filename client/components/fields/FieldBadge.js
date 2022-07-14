import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import Field from './Field'
import './FieldBadge.css'

/**
 * Show a Badge for a field.  This shows the tag, as well as the number of
 * papers in the field and a description for it.
 *
 * TODO Show an actual number of papers, rather than a dummy.
 *
 * @param {object} props    The react props object.
 * @param {object} props.field  The field we want to display a badge for.
 */
const FieldBadge = function(props) {

    // ======= Render ===============================================
    
    return (
        <div className='field-badge'>
            <div className="wrapper"><Field field={props.field} /> 100 papers</div>
            <div className="description">{ props.field.description }</div>

        </div>
    )
}

export default FieldBadge
