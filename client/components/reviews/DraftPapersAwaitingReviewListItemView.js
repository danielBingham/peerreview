import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams, Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getUserPapers, cleanupRequest } from '/state/users'

import Field from '/components/fields/Field'
import Spinner from '/components/Spinner'

import './DraftPapersAwaitingReviewListItemView.css'

const DraftPapersAwaitingReviewListItemView = function(props) {
    const paper = props.paper

    let authorList = ''
    for (let i = 0; i < paper.authors.length; i++) {
        authorList += paper.authors[i].user.name 
        if (i < paper.authors.length-1) {
            authorList += ', '
        }
    }

    let fields = []
    for( const field of paper.fields ) {
        fields.push(<Field key={field.id} field={field} />)
    }

    const paperPath = `/draft/${paper.id}`
    return (
        <div id={paper.id} className="draft-paper">
            <div className="reviews list-score-box">0 <span className="label">reviews</span></div>
            <div className="wrapper">
                <div className="title"> <Link to={paperPath}>{paper.title}</Link></div>
                <div className="authors">by {authorList}</div>
                <div className="fields"> {fields}</div>
            </div>
        </div>
    )
}

export default DraftPapersAwaitingReviewListItemView
