
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams, Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { getUserPapers, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'

const DraftPapersListItemView = function(props) {
    const paper = props.paper

    let authorList = ''
    for (let i = 0; i < paper.authors.length; i++) {
        authorList += paper.authors[i].user.name 
        if (i < paper.authors.length-1) {
            authorList += ', '
        }
    }

    let fieldList = ''
    for( const field of paper.fields ) {
        fieldList += `[${field.name}] `
    }

    const paperPath = `/draft/${paper.id}`
    return (
        <div id={paper.id} className="draft-paper-list-item">
            <div className="draft-paper-reviews list-score-box">0 reviews</div>
            <div className="draft-paper-title"> <Link to={paperPath}>{paper.title}</Link></div>
            <div className="draft-paper-authors">by {authorList}</div>
            <div className="draft-paper-fields"> {fieldList}</div>
        </div>
    )
}

export default DraftPapersListItemView
