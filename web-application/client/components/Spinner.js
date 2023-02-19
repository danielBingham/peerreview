import React from 'react'

import './Spinner.css'

const Spinner = function(props) {

    if ( props.local == true) {
        return (
            <div className="spinner-wrapper local">
                <div className="spinner-local"></div>
            </div>
        )
    } else {
        return ( <div className="spinner"></div> )
    }

}

export default Spinner
