import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import Field from './Field'
import './FieldBadge.css'

const FieldBadge = function(props) {

    return (
        <div className='field-badge'>
            <div className="wrapper"><Field field={props.field} /> 100 papers</div>
            <div className="description">{ props.field.description }</div>

        </div>
    )
}

export default FieldBadge
