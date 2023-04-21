import React from 'react'
import ReactMarkdown from 'react-markdown'

const IntroductionSection = function(props) {

    return (
        <section id="introduction">
            <ReactMarkdown>
                {` 
Peer Review is an experiment in scholarly publishing. It is a platform that
enables crowdsourced peer review and public dissemination of scientific and
academic papers.  For now, the platform can only handle pre-prints.  It is and
will remain [open source](https://github.com/danielbingham/peerreview) and
diamond open access.  It is currently being maintained by a single developer as
a side project. 

Peer Review uses a reputation system to ensure that review and refereeing is
done by qualified peers.  Reputation is primarily gained from publishing, but
can also be gained from giving constructive reviews.  Review is separated into
pre-publish "review" and post-publish "refereeing".  Review is entirely focused
on giving authors constructive, supportive feedback.  Refereeing is intended to
help maintain the integrity of the overall literature by identifying spam,
malpractice, and misinformation.  To learn more, please read [how it
works](/about#how-it-works).
                `}
            </ReactMarkdown>
            <h3>Contents</h3>
            <ul>
                <li><a href="#how-it-works">How it Works</a></li>
                <li><a href="#governance">Governance and Structure</a></li>
                <li><a href="#the-team">The Team</a></li>
                <li><a href="#faq">Frequently Asked Questions</a></li>
            </ul>
        </section>

    )
}

export default IntroductionSection
