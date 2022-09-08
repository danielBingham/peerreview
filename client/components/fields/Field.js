import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { XIcon } from '@heroicons/react/outline'

import './Field.css'

// Field tag background colors.
const colors = {

    biology: {
        background: '#5ea560',
        color: 'white'
    },
    chemistry: {
        background: '#38646c',
        color: 'white'
    },
    physics: {
        background: '#af5b59',
        color: 'white'
    },
    'computer-science': {
        background: '#c17126',
        color: 'white'
    },
    psychology: {
        background: '#6b2c50',
        color: 'white'
    },
    art: {
        background: '#bc70bf', 
        color: 'white'
    },
    economics: {
        background: '#d8cf6a',
        color: 'black'
    },
    sociology: {
        background: '#342c6b',
        color: 'white'
    },
    geology: {
        background: '#6b4e2e', 
        color: 'white'
    },
    'environmental-science': {
        background: '#3d632b', 
        color: 'white'
    }, 
    history: {
        background: '#33476d', 
        color: 'white'
    },
    'materials-science': {
        background: '#424551', 
        color: 'white'
    },
    geography: {
        background: '#2f6e7c',
        color: 'white'
    },
    engineering: {
        background: '#cea321', 
        color: 'black'
    },
    business: {
        background: '#60554e',
        color: 'white'
    },
    'political-science': {
        background: '#6249a3',
        color: 'white'
    },
    mathematics: {
        background: '#08186b',
        color: 'white'
    },
    medicine: {
        background: '#a31f1f', 
        color: 'white'
    },
    philosophy: {
        background: 'purple', //TODO
        color: 'white'
    }
}


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

    // Generate the field tag background colors.
    const types = props.field.type.split(':')
    let background = '#ddd'
    let color = 'black'
    if ( types.length == 1 ) {
        if ( colors[types[0]]) {
            background = colors[types[0]].background
            color = colors[types[0]].color
        }
    } else {
        background = 'linear-gradient(to right'
        for(const type of types) {
            if ( ! colors[type] ) {
                continue
            }
            background += ', ' + colors[type].background
        }
        background += ')'
        color = 'white'
    }

    
    return (
        <div className={ `field ${props.field.type}` } style={{ color: color, background: background }} >
            <Link to={ `/field/${props.field.id}` }>
                {props.field.name}
            </Link>
            { props.remove &&  <div className="remove" onClick={remove}><XIcon /></div> }
        </div>
    )
}

export default Field 
