import React from 'react'

import './ListNoContent.css'

const ListNoContent = function(props) {

    return (
        <div 
            className="list-no-content" 
            style={ props.children ? { "display": "block" } : { "display": "none" } } 
        >
            { props.children }
        </div>
    )

}

export default ListNoContent
