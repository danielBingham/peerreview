import React, { useState, useEffect } from 'react'

import UserBadge from '/components/users/UserBadge'

import './PublishedPaperAuthorsWidget.css'

const PublishedPaperAuthorsWidget = function(props) {

    const authors = []
    for (const author of props.paper.authors) {
        authors.push(<UserBadge key={author.user.id} id={author.user.id} fields={props.paper.fields} />)
    }

    return (
        <div className="paper-authors">
            {authors}
        </div>
    )
}

export default PublishedPaperAuthorsWidget
