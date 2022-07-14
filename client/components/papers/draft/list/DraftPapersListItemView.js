
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useParams, Link } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import UserTag from '/components/users/UserTag'
import Field from '/components/fields/Field'
import Spinner from '/components/Spinner'

import './DraftPapersListItemView.css'

/**
 * @see `/server/daos/papers.js::hydratePaper()` for the structure of the
 * `paper` object.
 */

/**
 * Render a single item in the DraftPapersListView.  Takes a single paper,
 * assumed to be a draft, and renders a list box for them.
 *
 * @param {object} props    The React props object.
 * @param {object} paper    The `paper` object we want to render a list box for.
 */
const DraftPapersListItemView = function(props) {

    // ======= Render ===============================================
    
    const authors = [] 
    for (const author of props.paper.authors) {
        authors.push(<UserTag key={author.user.id} id={author.user.id} />)
    }

    const fields = []
    for( const field of props.paper.fields ) {
        fields.push(<Field key={field.id} field={field} />)
    }

    const paperPath = `/draft/${props.paper.id}`
    return (
        <div id={props.paper.id} className="draft-paper-list-item">
            <div className="reviews list-score-box">0 <br /><span className="label">reviews</span></div>
            <div className="version list-score-box">1 <br /><span className="label">version</span></div>
            <div className="wrapper">
                <div className="title"> <Link to={paperPath}>{props.paper.title}</Link></div>
                <div className="authors">by {authors}</div>
                <div className="fields"> {fields}</div>
            </div>
        </div>
    )
}

export default DraftPapersListItemView
