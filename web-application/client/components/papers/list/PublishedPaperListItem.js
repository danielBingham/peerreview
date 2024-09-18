import React  from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid'

import UserTag from '/components/users/UserTag'
import Field from '/components/fields/Field'
import DateTag from '/components/DateTag'
import JournalSubmissionsTags from '/components/journals/JournalSubmissionsTags'

import './PublishedPaperListItem.css'

const PublishedPaperListItem = function(props) {
    const paper = props.paper

    // ======= Render ===============================================
    
    const authors = []
    for(const author of paper.authors) {
        authors.push(<UserTag key={author.userId} id={author.userId} />)
    }

    const fields = []
    for (const field of paper.fields) {
        fields.push(<Field key={field.id} id={field.id} />)
    }

    return (
        <div id={paper.id} className="published-paper-list-item">
            <div className="wrapper">
                <JournalSubmissionsTags id={paper.id} />
                <div className="title"> <Link to={`/paper/${paper.id}`}> {paper.title} <ArrowLeftOnRectangleIcon /></Link></div> 
                <div className="date-and-authors">published <DateTag timestamp={paper.updatedDate} /> by {authors}</div>
                <div className="fields">{fields}</div>
            </div>
        </div>
    )
}

export default PublishedPaperListItem
