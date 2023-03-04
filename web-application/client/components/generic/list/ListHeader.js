import React from 'react'

import './ListHeader.css'

const ListHeader = function(props) {


    return (
        <div className="list-header">
            <h2>{props.title}</h2>
            <div className="controls">
                { props.children }
            </div>
        </div>
    )
}

export default ListHeader
