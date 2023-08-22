import React from 'react'

import './PageHeader.css'

const PageHeader = function(props) {


    return (
        <div className="page-header">
                { props.children }
        </div>
    )
}

export default PageHeader 
