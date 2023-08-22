import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import { XMarkIcon } from '@heroicons/react/24/outline'

import { getField, cleanupRequest } from '/state/fields'

import Spinner from '/components/Spinner'

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


    // ======= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.fields.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================
    
    let field = useSelector(function(state) {
        if ( props.id ) {
            return state.fields.dictionary[props.id]
        } else {
            return null
        }
    })

    // ======= Actions and Event Handling ===========================
   
    const dispatch = useDispatch()

    /**
     * The "x" has been clicked, call remove. 
     */
    const remove = function(event) {
        event.preventDefault()
        event.stopPropagation()
        props.remove(field)
    }

    useEffect(function() {
        if ( ! field && props.id ) {
            setRequestId(dispatch(getField(props.id)))
        } else if ( ! field ) {
            throw new Error ('Need a field to display a field!')
        }
    }, [ props.id ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId}))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    if ( ! field && props.id ) {
        return (<div className='field'> <Spinner local={true} /></div> )
    }

    // Generate the field tag background colors.
    const types = field.type.split(':')
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

    let content = (
        <a href={ `/field/${field.id}` } target={props.target ? props.target : "_self"} >
            {field.name}
        </a>

    )
    if ( props.noLink ) {
        content =  ( <span>{ field.name }</span> )
    }
    
    return (
        <div className={ `field ${field.type}` } style={{ color: color, background: background }} >
            { content }
            { props.remove &&  <div className="remove" onClick={remove}><XMarkIcon /></div> }
        </div>
    )
}

export default Field 
