import React from 'react'

import './GetInvolved.css'

const GetInvolved = function(props) {

    return (
        <div id="get-involved">
            <div class="ways-to-get-involved">
                <div id="follow" class="involve-method">
                    <p>Follow us on Twitter.</p>
                    <a href="https://twitter.com/peerreviewio" target="_blank">
                        <img src="img/twitter.png" />
                    </a>
                </div>
                <div id="sponsor" class="involve-method">
                    <p>Sponsor us on GitHub.</p>
                    <div class="sponsors-badge">
                        <a target="_blank" href="https://github.com/sponsors/danielBingham">
                            <img alt="GitHub Sponsors" src="https://img.shields.io/github/sponsors/danielbingham?style=for-the-badge" />
                        </a>
                    </div>
                </div>
                <div id="chat" class="involve-method">
                    <p>Join us on Slack.</p>
                    <a target="_blank" href="https://join.slack.com/t/peer-review-io/shared_invite/zt-1hocmaafn-7dr~wuqnasfFMRXygD_HxA">
                        <img alt="Slack" src="img/Slack_Mark.png" />
                    </a>
                </div>
                <div id="roadmap" class="involve-method">
                    <p>View the roadmap.</p>
                    <a target="_blank"  href="https://github.com/users/danielBingham/projects/6">
                        <img src="img/GitHub-Mark-64px.png" />
                    </a>
                </div>
                <div id="contribute" class="involve-method">
                    <p>Contribute to the source.</p>
                    <a target="_blank"  href="https://github.com/danielbingham/peerreview">
                        <img src="img/GitHub-Mark-64px.png" />
                    </a>
                </div>
                <div id="discuss" class="involve-method">
                    <p>Discuss the project.</p>
                    <a target="_blank" href="https://github.com/danielBingham/peerreview/discussions">
                        <img src="img/GitHub-Mark-64px.png" />
                    </a>
                </div>
            </div>
        </div>
    )
            
}

export default GetInvolved
