import React from 'react'
import ReactMarkdown from 'react-markdown'

import UserBadge from '/components/users/UserBadge'

import './ResponseView.css'

const ResponseView = function(props) {

    let vote = null
    if ( props.response.vote == 1 ) {
        vote = (
            <div className='vote-button vote-up highlight'>
            </div> 
        )
    } else if ( props.response.vote == -1 ) {
        vote = (
            <div className='vote-button vote-down highlight'>
            </div> 
        )

    }

    return (
        <div className="paper-response-view">
            <div className="sidebar">
                <div className="response-author">
                    <UserBadge id={props.response.userId} paperId={props.paper.id} /> 
                </div>
                <div className="vote-widget">
                    { vote }
                </div>
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
