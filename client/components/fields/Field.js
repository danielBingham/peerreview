import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { XIcon } from '@heroicons/react/outline'

import './Field.css'

const Field = function(props) {

    const remove = function(event) {
        event.preventDefault()
        event.stopPropagation()
        props.remove(props.field)
    }

    return (
        <div className={ `field ${props.field.type}` }>
            <Link to={ `/field/${props.field.id}` }>
                {props.field.name}
            </Link>
            { props.remove &&  <div className="remove" onClick={remove}><XIcon /></div> }
        </div>
    )
}

export default Field 
