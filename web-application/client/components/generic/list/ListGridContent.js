import React from 'react'

import './ListGridContent.css'

const ListGridContent = function(props) {

    return (
        <div className="list-grid-content">
            { props.children }
        </div>
    )
}

export default ListGridContent
