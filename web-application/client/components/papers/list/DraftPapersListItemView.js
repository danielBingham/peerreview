import React from 'react'
import { Link } from 'react-router-dom'

import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid'

import JournalSubmissionsTags from '/components/journals/JournalSubmissionsTags'
import UserTag from '/components/users/UserTag'
import Field from '/components/fields/Field'
import DateTag from '/components/DateTag'

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
        authors.push(<UserTag key={author.userId} id={author.userId} />)
    }

    const fields = []
    for( const field of props.paper.fields ) {
        fields.push(<Field key={field.id} id={field.id} />)
    }

    const paperPath = `/paper/${props.paper.id}`
    return (
        <div id={props.paper.id} className="draft-paper-list-item">
            <div className="wrapper">
                <JournalSubmissionsTags id={props.paper.id} />
                <div className="title"> <Link to={paperPath}>{props.paper.title}<ArrowLeftOnRectangleIcon /></Link></div>
                <div className="authors">submitted on <DateTag timestamp={props.paper.createdDate} /> by {authors}</div>
                <div className="fields"> {fields}</div>
            </div>
        </div>
    )
}

export default DraftPapersListItemView
