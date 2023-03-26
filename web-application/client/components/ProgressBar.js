import React from 'react'

import './ProgressBar.css'

const ProgressBar = function(props) {

    return (
        <div className="progress-bar">
            <span style={{ width: props.progress + "%" }} ></span>
        </div>
    )

}

export default ProgressBar
