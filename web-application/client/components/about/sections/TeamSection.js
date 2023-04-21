import React from 'react'
import ReactMarkdown from 'react-markdown'

import './TeamSection.css'

const TeamSection = function(props) {

    return (
        <section id="the-team">
            <h2>The Team</h2>
            <ReactMarkdown>
                {`
Peer Review is currently the side project of a single software engineer.  
                `}
            </ReactMarkdown>
            <h3>Daniel Bingham</h3>
            <img src="/img/danielbingham.jpg" />
            <ReactMarkdown>
                {` 
Daniel has worked as a Full Stack Software Engineer, DevOps, and Engineering
Manager for over 14 years at GE, Ideacode, EllisLab, Ceros, and currently as
SRE Manager for Business Insider.  He's helped develop highly complex
applications and built software teams from the ground up.

When he's not writing software, he's working on municipal public policy and in
democratic organizations. He co-chaired the City of Bloomington's Task Force on
Government Innovation.  Spent three years serving as Board President of
Bloomington's 501(c)3 housing cooperative, Bloomington Cooperative Living.
Worked with Bloomington's grocery cooperative, BloomingFoods.  And served on
the board of the Bloomington Community Orchard.  
                `}
            </ReactMarkdown>
            <div className="social-links">

            </div>
        </section>

    )
}

export default TeamSection 
