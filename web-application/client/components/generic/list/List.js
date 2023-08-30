import React from 'react'

import './List.css'

export const List = function({ className, children }) {

    return (
        <div className={`list ${ className ? className : ''}`}>
            { children }
        </div>
    )
}

export const ListHeader = function({ children }) {

    return (
        <div className="list-header">
            { children }
        </div>
    )
}

export const ListTitle = function({ children }) {

    return (
        <h2>{ children }</h2>
    )
}

export const ListControls = function({ children }) {
    return (
        <div className="controls">
            { children }
        </div>
    )
}

export const ListControl = function({ children }) {

    return (
        <div className="list-control">
            { children }
        </div>
    )

}

export const ListGridContent = function(props) {

    return (
        <div className="list-grid-content">
            { props.children }
        </div>
    )
}


export const ListNoContent = function(props) {

    return (
        <div 
            className="list-no-content" 
            style={ props.children ? { "display": "block" } : { "display": "none" } } 
        >
            { props.children }
        </div>
    )

}

export const ListRowContent = function(props) {

    return (
        <div className="list-row-content">
            { props.children }
        </div>
    )
}
