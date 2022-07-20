import React from 'react'
import ReactMarkdown from 'react-markdown'

import UserBadge from '/components/users/UserBadge'

import './ResponseView.css'

const ResponseView = function(props) {

    return (
        <div className="paper-response-view">
            <div className="response-author">
                <UserBadge id={props.response.userId} fields={props.paper.fields} /> 
            </div>
            <div className="response-content">
                <ReactMarkdown>
                    { props.response.versions[0].content }
                </ReactMarkdown>
            </div>
        </div>
    )

}

export default ResponseView
