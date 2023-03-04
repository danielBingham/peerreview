import React from 'react'

import './ListControl.css'

const ListControl = function(props) {

    return (
        <a href={props.url} 
            onClick={(e) => { e.preventDefault(); props.onClick()}} 
            className={props.selected ? 'list-control selected' : 'list-control' } >{ props.name }</a>
    )

}

export default ListControl
