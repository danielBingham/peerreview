import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import './Field.css'

const Field = function(props) {

    return (
        <div className={ `field ${props.field.type}` }><Link to={ `/field/${props.field.id}` }>{props.field.name}</Link></div>
    )
}

export default Field 
