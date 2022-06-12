import React, { useState, useEffect } from 'react'

const PublishedPaperAuthorsWidget = function(props) {

    let authorString = ''
    for(const author of props.paper.authors) {
        authorString += author.user.name + ( author.order < props.paper.authors.length ? ',' : '')
    }

    return (
        <div className="paper-authors">{authorString}</div>
    )
}

export default PublishedPaperAuthorsWidget
