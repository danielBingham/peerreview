
import React from 'react'
import { Link } from 'react-router-dom'

import { useSelector } from 'react-redux'

import JournalSubmissionsTags from '/components/journals/JournalSubmissionsTags'
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

    const reviewCount = useSelector(function(state) {
        if ( state.reviews.counts[props.paper.id] ) {
            if ( state.reviews.counts[props.paper.id][props.paper.versions[0].version] ) {
                return state.reviews.counts[props.paper.id][props.paper.versions[0].version]
            } else {
                return 0
            }
        } else {
            return 0
        }
    })

    // ======= Render ===============================================
   
    let submission = (<div className="preprint">Preprint</div>)

    const authors = [] 
    for (const author of props.paper.authors) {
        authors.push(<UserTag key={author.userId} id={author.userId} />)
    }

    const fields = []
    for( const field of props.paper.fields ) {
        fields.push(<Field key={field.id} id={field.id} />)
    }

    const paperPath = `/draft/${props.paper.id}`
    return (
        <div id={props.paper.id} className="draft-paper-list-item">
            <div className="reviews list-score-box">
                {reviewCount} <br />
                <span className="label">{ reviewCount == 1 ? 'review' : 'reviews' }</span></div>
            <div className="version list-score-box"> 
                {props.paper.versions.length} <br />
                <span className="label">{ props.paper.versions.length == 1 ? 'version' : 'versions' }</span></div>
            <div className="wrapper">
                <JournalSubmissionsTags id={props.paper.id} />
                <div className="title"> <Link to={paperPath}>{props.paper.title}</Link></div>
                <div className="authors">by {authors}</div>
                <div className="fields"> {fields}</div>
            </div>
        </div>
    )
}

export default DraftPapersListItemView
