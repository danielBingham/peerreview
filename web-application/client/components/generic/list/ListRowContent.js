import React from 'react'

import './ListRowContent.css'

const ListRowContent = function(props) {

    return (
        <div className="list-row-content">
            { props.children }
        </div>
    )
}

export default ListRowContent
