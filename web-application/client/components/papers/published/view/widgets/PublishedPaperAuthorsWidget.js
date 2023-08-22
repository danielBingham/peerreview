import React, { useState, useEffect } from 'react'

import UserBadge from '/components/users/UserBadge'

import './PublishedPaperAuthorsWidget.css'

const PublishedPaperAuthorsWidget = function(props) {

    const authors = []
    for (const author of props.paper.authors) {
        authors.push(<UserBadge key={author.userId} id={author.userId} paperId={props.paper.id} />)
    }

    return (
        <div className="paper-authors">
            {authors}
        </div>
    )
}

export default PublishedPaperAuthorsWidget
