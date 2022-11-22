import React from 'react'

import './GetInvolved.css'

const GetInvolved = function(props) {

    return (
        <div id="get-involved">
            <div className="ways-to-get-involved">
                <div id="github" className="involve-method">
                    <p>Contribute on GitHub.</p>
                    <a href="https://github.com/danielbingham/peerreview"><img src="/img/GitHub-Mark-64px.png" /></a>
                </div>
                <div id="sponsor" className="involve-method">
                    <p>Sponsor us on GitHub.</p>
                    <div className="sponsors-badge"><a href="https://github.com/sponsors/danielBingham"><img alt="GitHub Sponsors" src="https://img.shields.io/github/sponsors/danielbingham?style=for-the-badge" /></a></div>
                </div>
                <div id="slack" className="involve-method">
                    <p>Join us on Slack.</p>
                    <a href="https://join.slack.com/t/peer-review-io/shared_invite/zt-1hocmaafn-7dr~wuqnasfFMRXygD_HxA"><img alt="Slack" src="/img/Slack_Mark.png" /></a>
                </div>
            </div>
        </div>
    )
}

export default GetInvolved
