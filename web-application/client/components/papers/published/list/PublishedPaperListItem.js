import React  from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import UserTag from '/components/users/UserTag'
import Field from '/components/fields/Field'
import DateTag from '/components/DateTag'

import './PublishedPaperListItem.css'

const PublishedPaperListItem = function(props) {
    const paper = props.paper

    const responseCount = useSelector(function(state) {
        return  ( state.responses.counts[paper.id] ? state.responses.counts[paper.id] : 0)
    })

    // ======= Render ===============================================
    const authors = []
    for(const author of paper.authors) {
        authors.push(<UserTag key={author.user.id} id={author.user.id} />)
    }

    const fields = []
    for (const field of paper.fields) {
        fields.push(<Field key={field.id} field={field} />)
    }

    return (
        <div id={paper.id} className="published-paper-list-item">
            <div className="score">{paper.score}<br /> <span className="label">score</span></div> 
            <div className="responses">{responseCount} <br /><span className="label">responses</span></div>
            <div className="wrapper">
                <div className="title"> <Link to={`/paper/${paper.id}`}> {paper.title} </Link></div> 
                <div className="date-and-authors">published <DateTag timestamp={paper.updatedDate} /> by {authors}</div>
                <div className="fields">{fields}</div>
            </div>
        </div>
    )
}

export default PublishedPaperListItem
