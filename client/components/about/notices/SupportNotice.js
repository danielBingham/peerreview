import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { XCircleIcon } from '@heroicons/react/solid'

import './SupportNotice.css'

const SupportNotice = function(props) {
    const [ isClosed, setIsClosed ] = useState(false)

    const close = function(event) {
        setIsClosed(true)
    }

    if ( ! isClosed ) {
        return (
            <div className="support-notice">
                <div className="close" onClick={close}><XCircleIcon /></div>
                <p>
                    Peer Review needs funding to support development and
                    infrastructure.  Since we're diamond open access, we're not
                    charging a fee to publish or to access.  We're counting on
                    support from the community.
                </p>

                <p>
                    If you want to see us grow to become the scholar lead
                    academic publishing community we hope to become, please
                    consider <a
                    href="https://github.com/sponsors/danielBingham">supporting
                    us</a> through Github Sponsors!
                </p>
            </div>
        )
    } else {
        return (null)
    }
}

export default SupportNotice
