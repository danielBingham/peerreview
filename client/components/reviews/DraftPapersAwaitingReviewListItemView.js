import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams, Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import UserTag from '/components/users/UserTag'
import Field from '/components/fields/Field'
import Spinner from '/components/Spinner'

import './DraftPapersAwaitingReviewListItemView.css'

const DraftPapersAwaitingReviewListItemView = function(props) {
    const paper = props.paper

    const authors = []
    for ( const author of paper.authors) {
        authors.push(<UserTag key={author.user.id} id={author.user.id} />)
    }

    let fields = []
    for( const field of paper.fields ) {
        fields.push(<Field key={field.id} field={field} />)
    }

    const paperPath = `/draft/${paper.id}`
    return (
        <div id={paper.id} className="draft-paper-list-item">
            <div className="reviews list-score-box">0 <br/><span className="label">reviews</span></div>
            <div className="version list-score-box">1 <br/><span className="label">version</span></div>
            <div className="wrapper">
                <div className="title"> <Link to={paperPath}>{paper.title}</Link></div>
                <div className="authors">by {authors}</div>
                <div className="fields"> {fields}</div>
            </div>
        </div>
    )
}

export default DraftPapersAwaitingReviewListItemView
