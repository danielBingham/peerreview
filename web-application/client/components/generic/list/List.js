import React from 'react'

import './List.css'

const List = function(props) {

    return (
        <div className={`list ${props.className}`}>
            { props.children }
        </div>
    )
}

export default List
