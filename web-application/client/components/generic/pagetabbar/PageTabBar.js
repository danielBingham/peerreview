import React from 'react'

import './PageTabBar.css'

const PageTabBar = function(props) {


    return (
        <div className="page-tab-bar">
            <div className="tabs-wrapper">
                { props.children }
            </div>
        </div>
    )
}

export default PageTabBar
