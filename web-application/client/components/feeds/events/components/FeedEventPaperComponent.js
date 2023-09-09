import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import UserTag from '/components/users/UserTag'

import './FeedEventPaperComponent.css'

const FeedEventPaperComponent = function({ paperId }) {
    
    const paper = useSelector(function(state) {
        return state.papers.dictionary[paperId]
    })

    const authorViews = []
    for(const author of paper.authors) {
        authorViews.push(
            <UserTag key={author.userId} id={author.userId} />
        )
    }

    return (
        <div className="feed-event-paper-component">
            <Link to={`/paper/${paperId}`}>{ paper.title }</Link> by {authorViews} 
        </div>
    )


}

export default FeedEventPaperComponent
