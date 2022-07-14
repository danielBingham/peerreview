import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { XIcon } from '@heroicons/react/outline'

import './Field.css'

/**
 * Show a tag for a field, linking to the FieldPage for this field.  May be
 * given a `remove` function, in which case an "x" will be displayed on the
 * field and the given `remove` function will be called when the 'x' is
 * clicked.  
 *
 * @param {object} props    The react props object.
 * @param {object} props.field  The field we'd like to display a tag for.
 * @param {function} props.remove   (Optional) A function to be called when the
 * "X" is clicked.  If not provided, no "X" will be displayed.
 */
const Field = function(props) {

    // ======= Actions and Event Handling ===========================

    /**
     * The "x" has been clicked, call remove. 
     */
    const remove = function(event) {
        event.preventDefault()
        event.stopPropagation()
        props.remove(props.field)
    }

    // ======= Render ===============================================
    
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
