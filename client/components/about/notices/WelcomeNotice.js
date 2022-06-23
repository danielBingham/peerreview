import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import './WelcomeNotice.css'

const WelcomeNotice = function(props) {
    const [ isClosed, setIsClosed ] = useState(false)

    const close = function(event) {
        setIsClosed(true)
    }

    if ( ! isClosed ) {
        return (
            <div className="welcome-notice">
                <div className="close" onClick={close}>x</div>
                <p>
                    Welcome to Peer Review!  Peer Review is an open source, diamond
                    open access (free to access, free to publish) scientific
                    publishing repository.  You can submit your papers here to be
                    peer reviewed and published.
                </p>  

                <p>
                    The peer review process is self selected, using a
                    reputation system to ensure that only knolwedgeable peers
                    are offering reviews. Review is split into two pieces:
                    pre-publish editorial review and post publish refereeing.
                    The first is visible only to peers in your field, the
                    second is public. To learn more, please read <a
                    href="/about#how-it-works">how it works</a>.
                </p>

                <p>
                    Our goal is to replace the scientific journal system with
                    something open, scholar lead, and community managed.  We hope
                    to solve any number of problems plauging scientific publishing
                    in the process, but we're starting with the file drawer
                    problem. To learn more about our reasoning and the
                    problems we hope to solve, read <Link to="/about#rationale">our
                    rationale</Link>.
                </p>
            </div>
        )
    } else {
        return (null) 
    }
}

export default WelcomeNotice
