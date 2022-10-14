import React from 'react'
import ReactMarkdown from 'react-markdown'

const IntroductionSection = function(props) {

    return (
        <section id="introduction">
            <ReactMarkdown>
                {` 
Peer Review is an [open source](https://github.com/danielbingham/peerreview), diamond open access (free to access, free to
publish), non-profit academic publishing platform.  The
platform enables crowdsourced peer review and public dissemination of scholarly
papers.

The peer review process is self selected, using a reputation system to ensure
that only knowledgeable peers are offering reviews. To learn more,
please read [how it works](/about#how-it-works).

Our goal is to replace the academic journal system with something open to its
core, democratic, and community managed.  We hope to solve any number of
problems in the process, but we're starting with the file drawer problem. To learn more about
our reasoning and the problems we hope to
solve, read [our rationale](/about#rationale).
                `}
            </ReactMarkdown>
        </section>

    )
}

export default IntroductionSection
