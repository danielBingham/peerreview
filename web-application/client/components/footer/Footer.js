import React from 'react'

import './Footer.css'

const Footer = function(props) {


    // ======= Render ===============================================
    return (
     <footer>
         <div className="wrapper">
            <div className="explanation-copyright">
                <p className="explanation">JournalHub is a universal scholarly
                    publishing platform. It supports preprints, preprint
                    review, journal review and publishing, and post publication
                    review.  There are plans to support library publishing,
                    university presses, and institutional publishing as well.
                    It aims to be simple, clear, and cohesive, providing a
                    consistent user experience while supporting many different
                        approaches to review and publishing.</p><p className="explanation"> It is currently being
                    developed by a single developer.  All
                    publications must be Diamond Open Access.  The platform is
                    open source and the intention is to become a non-profit,
                democratically governed, multi-stakeholder cooperative.</p>
                
                <p>Site text (c) <a href="https://github.com/danielbingham">Daniel Bingham</a> 2022 - 2023</p>
                <p>All user content (c) its authors.</p>
                <p>All content licensed under Creative Commons <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>
            </div>
            <div className="about-links">
                <p><a href="/about">about</a></p>
                <p><a href="https://blog.peer-review.io">blog</a></p>
                <p><a href="/tos">terms of service</a></p>
                <p><a href="/privacy">privacy policy</a></p>
            </div>
            <div className="content-links">
                <p><a href="/">papers</a></p>
                <p><a href="/preprints">preprints</a></p>
                <p><a href="/journals">journals</a></p>
                <p><a href="/fields">taxonomy</a></p>
                <p><a href="/users">users</a></p>
            </div>
            <div className="involve-links">
                <p><a target="_blank" href="https://twitter.com/peerreviewio">Follow us on Twitter.</a></p>
                <p><a target="_blank" href="https://github.com/sponsors/danielBingham">Sponsor us on Github.</a></p>
                <p><a target="_blank" href="https://join.slack.com/t/peer-review-io/shared_invite/zt-1hocmaafn-7dr~wuqnasfFMRXygD_HxA">Join us on Slack.</a></p>
                <p><a target="_blank" href="https://github.com/users/danielBingham/projects/6">View the Roadmap.</a></p>
                <p><a target="_blank" href="https://github.com/danielbingham/peerreview">Contribute to the Source.</a></p>
                <p><a target="_blank" href="https://github.com/danielBingham/peerreview/discussions">Discuss the project.</a></p>
            </div>
         </div>
    </footer>
    )

}

export default Footer
