import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import './SupportNotice.css'

const SupportNotice = function(props) {
    const [ isClosed, setIsClosed ] = useState(false)

    const close = function(event) {
        setIsClosed(true)
    }

    if ( ! isClosed ) {
        return (
            <div className="support-notice">
                <div className="close" onClick={close}>x</div>
                <p>
                    Peer Review is currently being developed by a single software
                    engineer and a small handful of very part time volunteers.  If
                    you want to see us grow to become the scholar lead academic
                    publishing community we hope to become, please consider
                    supporting us!
                </p>
            </div>
        )
    } else {
        return (null)
    }
}

export default SupportNotice
