import React  from 'react'
import { Link } from 'react-router-dom'

import Field from '/components/fields/Field'

import './PublishedPaperListItem.css'

const PublishedPaperListItem = function(props) {
    const paper = props.paper

    let authorList = ''
    for (let i = 0; i < paper.authors.length; i++) {
        authorList += paper.authors[i].user.name 
        if (i < paper.authors.length-1) {
            authorList += ', '
        }
    }

    const fields = []
    for (const field of paper.fields) {
        fields.push(<Field key={field.id} field={field} />)
    }
    let score = 0
    for (const vote of paper.votes) {
        score += vote.score
    }

    return (
        <div id={paper.id} className="published-paper">
            <div className="votes">{score}<br /> <span className="label">votes</span></div> 
            <div className="responses">0 <br /><span className="label">responses</span></div>
            <div className="wrapper">
                <div className="title"> <Link to={`/paper/${paper.id}`}> {paper.title} </Link></div> 
                <div className="authors">by {authorList}</div>
                <div className="fields">{fields}</div>
            </div>
        </div>
    )
}

export default PublishedPaperListItem